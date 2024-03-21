import VVwE, { IncrementReturn } from "version-vector-with-exceptions";
import { v4 } from "uuid";
import sortedIndexBy from "lodash.sortedindexby";

import AbstractBroadcast from "./../abstract/abstract-broadcast";
import messages from "./messages";
import AbstractNetwork from "../../abstract/abstract-network";

/**
 * Format the IDs of messages in string format
 * @param  {Object} message - The message to format
 * @return {string} The formatted message's id in string format
 */
// e=entry and c=counter
const formatID = (message: { id: { e: string; c: number } }) =>
  `e=${message.id.e}&c=${message.id.c}`;

/**
 * Broadcast represent the base implementation of a broadcast protocol for the foglet library.
 * Based on the CausalBroadcastDefinition Package: see: https://github.com/Chat-Wane/CausalBroadcastDefinition
 * @extends AbstractBroadcast
 * @author Arnaud Grall (Folkvir)
 */
class Broadcast extends AbstractBroadcast {
  private options: { id: string; delta: number };
  private causality: VVwE;
  private queue: never[];
  private intervalAntiEntropy: NodeJS.Timeout;
  private bufferAntiEntropy: {
    issuer: string;
    type: string;
    id: string;
    causality: VVwE;
    nbElements: number;
    element: undefined;
    elements: { id: IncrementReturn; payload: unknown }[];
    [key: string]: unknown;
  };

  /**
   * Constructor
   * @param  {AbstractNetwork} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor(source: AbstractNetwork, protocol: string) {
    super(source, protocol);
    if (source && protocol) {
      this.options = {
        id: source.id,
        delta: 1000 * 30,
      };
      // the id is your id, base on the .PEER id in the RPS options
      this.causality = new VVwE(this.options.id);
      // buffer of received messages
      this.queue = [];
      // buffer of anti-entropy messages (chunked because of large size)
      this.bufferAntiEntropy = messages.formatAntiEntropyResponse("init");
    } else {
      throw new Error("fBroadcast: not enough parameters");
    }
  }

  /**
   * Send a message to all neighbours
   * @private
   * @param  {Object} message - The message to send
   * @return {void}
   */
  private sendAll(message: unknown) {
    const neighbours = this.source.getNeighbours(Infinity);

    if (neighbours.length > 0) {
      neighbours.forEach((p) => {
        this.unicast.send(p, message).catch((e: Error) => {
          console.debug(e);
        });
      });
    }
  }

  /**
   * Send a message in broadcast
   * @param  {Object}  message  - The message to send
   * @param  {Object} [id] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation
   * @param  {Object} [isReady] {e: <stringId>, c: <Integer>} this uniquely represents the id of the operation that we must wait before delivering the message
   * @return {boolean}
   */
  send(
    message: object,
    id?: string,
    isReady?: IncrementReturn,
    useIsReady = true,
  ) {
    // Don't know about this, but it seems all the methods below rely on a VVwE instance,
    // which wouldn't be the case if id exists due to the old pipe:
    // const messageId = id || this.causality.increment();
    if (id) {
      return id;
    }

    const messageId = this.causality.increment();

    if (messageId.e !== this.causality.local.e) {
      throw new Error(
        "The id of the identifier need to be equal to: " +
          this.causality.local.e,
      );
    } else if (messageId.c < this.causality.local.v) {
      throw new Error(
        "Cant send the message because the identifier has a counter lower than our local counter: need to be equal to " +
          this.causality.local.v +
          1,
      );
    } else if (messageId.c > this.causality.local.v + 1) {
      throw new Error(
        "Cant send the message because the identifier has a counter higher than the counter accepted: need to be equal to " +
          this.causality.local.v +
          1,
      );
    }

    let ready = isReady;

    if (useIsReady && !ready && messageId.c > 1) {
      // if the counter is higher than one, it means that we already send messages on the network
      ready = {
        e: messageId.e,
        c: messageId.c - 1,
      } satisfies IncrementReturn;
    }
    const broadcastMessage = messages.formatBroadcastMessage(
      this.protocol,
      id,
      ready,
      message,
    );

    if (typeof messageId !== "string") {
      // #2 register the message in the structure
      this.causality.incrementFrom(messageId);
    }

    // #3 send the message to the neighborhood
    this.sendAll(broadcastMessage);
    return messageId;
  }

  /**
   * We started anti-entropy mechanism in order to retrieve old missed files
   */
  startAntiEntropy(delta = this.options.delta) {
    this.intervalAntiEntropy = setInterval(() => {
      this.source
        .getNeighbours()
        .forEach((peer) =>
          this.unicast.send(
            peer,
            messages.formatAntiEntropyRequest(this.causality),
          ),
        );
    }, delta);

    this.on("antiEntropy", (id, messageCausality, ourCausality) =>
      this.defaultBehaviorAntiEntropy(id, messageCausality, ourCausality),
    );
  }

  /**
   * This callback depends on the type of the applications, this is the default behavior when you receive old missed files
   */
  private defaultBehaviorAntiEntropy(
    id: unknown,
    messageCausality: unknown,
    ourCausality: unknown,
  ) {
    console.debug(
      "(Warning) You should modify this, AntiEntropy default behavior: ",
      id,
      messageCausality,
      ourCausality,
    );
  }

  /**
   * Clear the AntiEntropy mechanism
   */
  clearAntiEntropy() {
    if (this.intervalAntiEntropy) {
      clearInterval(this.intervalAntiEntropy);
    }
  }

  /**
   * Send entropy response
   * @deprecated
   * @param  {[type]} origin             [description]
   * @param  {[type]} causalityAtReceipt [description]
   * @param  {[type]} elements           [description]
   * @return {[type]}                    [description]
   */
  // Deprecated and unused
  // sendAntiEntropyResponse(origin, causalityAtReceipt, elements) {
  //   const id = v4();
  //   // #1 metadata of the anti-entropy response
  //   let sent = this.unicast.send(
  //     origin,
  //     messages.MAntiEntropyResponse(id, causalityAtReceipt, elements.length),
  //   );
  //   let i = 0;
  //   while (sent && i < elements.length) {
  //     sent = this.unicast.send(
  //       origin,
  //       messages.MAntiEntropyResponse(id, null, elements.length, elements[i]),
  //     );
  //     ++i;
  //   }
  // }

  /**
   * Handler executed when a message is received
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  receive(id: string, message: typeof this.bufferAntiEntropy) {
    // if not present, add the issuer of the message in the message
    if (!message.issuer) {
      message.issuer = id;
    }

    switch (message.type) {
      case "MAntiEntropyRequest": {
        console.debug(id, message);
        this.emit("antiEntropy", id, message.causality, this.causality.clone());
        break;
      }
      case "MAntiEntropyResponse": {
        // #A replace the buffered message
        if (this.bufferAntiEntropy.id !== message.id) {
          this.bufferAntiEntropy = message;
        }

        // #B add the new element to the buffer
        if (message.element) {
          this.bufferAntiEntropy.elements.push(message.element);
        }

        // #C add causality metadata
        if (message.causality) {
          this.bufferAntiEntropy.causality = message.causality;
        }

        // #D the buffered message is fully arrived, deliver
        if (
          this.bufferAntiEntropy.elements.length ===
          this.bufferAntiEntropy.nbElements
        ) {
          // #1 consider each message in the response independently
          for (const element of this.bufferAntiEntropy.elements) {
            // #2 only check if the message has not been received yet
            if (!this.shouldStopPropagation(element)) {
              this.causality.incrementFrom(element.id);
              this.emit("receive", message.issuer, element.payload);
            }
          }

          // #3 merge causality structures
          this.causality.merge(this.bufferAntiEntropy.causality);
        }
        break;
      }

      default: {
        if (!this.shouldStopPropagation(message)) {
          // #1 register the operation
          // maintain `this._buffer` sorted to search in O(log n)
          const index = sortedIndexBy(this.queue, message, formatID);
          this.queue.splice(index, 0, message);
          // #2 deliver
          this.reviewBuffer();
          // #3 rebroadcast
          this.sendAll(message);
        }
        break;
      }
    }
  }

  /**
   * Check if a message should be propagated or not
   * @private
   * @param  {Object} message - The message to check
   * @return {boolean} True if the message should not be propagated, False if it should be.
   */
  private shouldStopPropagation(message) {
    return (
      this.causality.isLower(message.id) ||
      this.findInBuffer(formatID(message)) >= 0
    );
  }

  /**
   * Try to find the index of a message in the internal buffer
   * @private
   * @param  {string} id - Message's ID
   * @return {int} The index of the message in the buffer, or -1 if not found
   */
  private findInBuffer(id) {
    // use a binary search algorithm since `this._buffer` is sorted by IDs
    let minIndex = 0;
    let maxIndex = this.queue.length - 1;
    let currentIndex, currentElement;

    while (minIndex <= maxIndex) {
      currentIndex = ((minIndex + maxIndex) / 2) | 0;
      currentElement = formatID(this.queue[currentIndex]);

      if (currentElement < id) {
        minIndex = currentIndex + 1;
      } else if (currentElement > id) {
        maxIndex = currentIndex - 1;
      } else {
        return currentIndex;
      }
    }
    return -1;
  }

  /**
   * Scan internal buffer to deliver waiting messages
   * @private
   * @return {void}
   */
  private reviewBuffer() {
    let message;
    let found = false;
    for (let index = this.queue.length - 1; index >= 0; --index) {
      message = this.queue[index];
      if (this.causality.isLower(message.id)) {
        this.queue.splice(index, 1);
      } else {
        // console.log(message, this._causality.isReady(message.isReady), this._causality);
        if (this.causality.isReady(message.isReady)) {
          found = true;
          this.causality.incrementFrom(message.id);
          this.queue.splice(index, 1);
          this.emit("receive", message.issuer, message.payload);
        }
      }
    }
    if (found) {
      this.reviewBuffer();
    }
  }
}

export default Broadcast;
