import EventEmitter from "events";

/**
 * CommunicationProtocol represents an abstract communication protocol.
 * @abstract
 * @extends EventEmitter
 * @author Thomas Minier
 */
abstract class CommunicationProtocol extends EventEmitter {
  /**
   * Constructor
   * @param  {AbstractNetwork} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor(source, protocol) {
    super();
    this._source = source;
    this._protocol = protocol;
  }
  /**
   * Send a message
   * @param  {Object}  message  - The message to send
   * @return {boolean}
   */
  send(message: object, id: string) {
    throw new Error(
      "A valid communication protocol should implement a send method, message:" +
        message.toString(),
    );
  }

  /**
   * Handler executed when a message is recevied
   * @param  {string} id  - Message issuer's ID
   * @param  {Object} message - The message received
   * @return {void}
   */
  receive(id, message) {
    throw new Error(
      "A valid communication protocol should implement a _receiveMessage method; " +
        `(id, message)=(${id.toString()},${message.toString()})`,
    );
  }
}

export default CommunicationProtocol;
