import Foglet from "../foglet";
import AnswerQueue from "./answer-queue";
import utils from "./utils";

/**
 * FogletProtocol represents an abstract protocol.
 * A Protocol is a a set of behaviours used to interact with other foglets that shares the same protocol.
 * @abstract
 * @author Thomas Minier
 */
class FogletProtocol {
  private name: string;
  private foglet: Foglet;
  private answerQueue: AnswerQueue;
  /**
   * Constructor
   * @param  {string} name   - The protocol's name
   * @param  {Foglet} foglet - The Foglet instance used by the protocol to communicate
   * @param  {...*} args - Additional arguments passed down to the `_init` function
   */
  constructor(name: string, foglet: Foglet) {
    this.name = name;
    this.foglet = foglet;
    this.answerQueue = new AnswerQueue();
    this.initHandlers();
    // Unused? No parent classes have init... Is this some sort of "call parent's init"? Surely you wouldn't want to do that...
    if ("_init" in this) {
      // @ts-expect-error ???
      this.init(...args);
    }
  }

  /**
   * Helper to send a unicast message
   * @private
   * @param  {string} id  - ID of the peer to which the message should be sent
   * @param  {*} msg  - The message to send
   * @param  {function} resolve - Function used to resolve a related promise when an answer to the message is received
   * @param  {function} reject  - Function used to reject a related promise when an answer to the message is received
   * @return {void}
   */
  private sendUnicast(
    id: string,
    msg: Parameters<typeof this.answerQueue.stamp>[0],
    resolve?: Parameters<typeof this.answerQueue.stamp>[1],
    reject?: Parameters<typeof this.answerQueue.stamp>[2],
  ): void {
    this.foglet.sendUnicast(id, this.answerQueue.stamp(msg, resolve, reject));
  }

  // TODO: These appear to be unused? Maybe they are to be implemented by the user...
  // /**
  //  * Helper to send a broadcast message
  //  * @private
  //  * @param  {*} msg  - The message to send
  //  * @return {void}
  //  */
  // private sendBroadcast(msg: any): void {
  //   this.foglet.sendBroadcast(msg);
  // }

  // /**
  //  * Handler which resolve answers to messages
  //  * @private
  //  * @param {string} id - Sender's id
  //  * @param {Object} msg - Answer received
  //  * @return{void}
  //  */
  // private answerReply(id: string, msg: object): void {
  //   this.answerQueue.resolve(msg.answerID, msg.value);
  // }

  // /**
  //  * Handler which reject answers to messages
  //  * @private
  //  * @param {string} id - Sender's id
  //  * @param {Object} msg - Answer received
  //  * @return{void}
  //  */
  // private answerReject(id: string, msg: object): void {
  //   this.answerQueue.reject(msg.answerID, msg.value);
  // }

  /**
   * Initialize the reception of messages from unicast & broadcast channels
   * @private
   * @return {void}
   */
  private initHandlers(): void {
    this.foglet.onUnicast((id, msg) => this.handleUnicast(id, msg));
    this.foglet.onBroadcast((id, msg) => this.handleBroadcast(id, msg));
  }

  /**
   * Handle the reception of an unicast message
   * @private
   * @param {string} senderID - ID of the peer who send the message
   * @param {Object} msg - The message received
   * @return {void}
   */
  private handleUnicast(
    senderID: string,
    msg: {
      method: string;
      protocol: string;
      payload: unknown;
      answerID: string;
    },
  ): void {
    const handlerName = utils.handlerName(msg.method);
    if (this.name === msg.protocol && handlerName in this) {
      // apply before hooks
      const beforeReceive = utils.beforeReceiveName(msg.method);
      if (beforeReceive in this) {
        // @ts-expect-error Some sort of really crazy inheritance pattern...
        msg.payload = this[beforeReceive](msg.payload);
      }
      // do not generate helpers for message emitted through the reply & reject helpers
      if (msg.method !== "answerReply" && msg.method !== "answerReject") {
        const response = (value: unknown) => {
          this.sendUnicast(senderID, {
            protocol: this.name,
            method: "answerReply",
            payload: {
              answerID: msg.answerID,
              value,
            },
          });
        };

        const reject = (value: unknown) => {
          this.sendUnicast(senderID, {
            protocol: this.name,
            method: "answerReject",
            payload: {
              answerID: msg.answerID,
              value,
            },
          });
        };

        this[handlerName](senderID, msg.payload, response, reject);
      } else {
        this[handlerName](senderID, msg.payload);
      }
      // apply after receive hook
      const afterReceive = utils.afterReceiveName(msg.method);
      if (afterReceive in this) {
        this[afterReceive](msg.payload);
      }
    }
  }

  /**
   * Handle the reception of a broadcast message
   * @private
   * @param {string} senderID - ID of the peer who send the message
   * @param {Object} msg - The message received
   * @return {void}
   */
  private handleBroadcast(
    senderID: string,
    msg: { method: any; protocol: string; payload: any },
  ): void {
    const handlerName = utils.handlerName(msg.method);
    if (this.name === msg.protocol && handlerName in this) {
      // apply before hooks
      const beforeReceive = utils.beforeReceiveName(msg.method);
      if (beforeReceive in this) {
        msg.payload = this[beforeReceive](msg.payload);
      }
      // call handler
      this[handlerName](senderID, msg.payload);
      // apply after receive hook
      const afterReceive = utils.afterReceiveName(msg.method);
      if (afterReceive in this) {
        this[afterReceive](msg.payload);
      }
    }
  }
}

export default FogletProtocol;
