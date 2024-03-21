const uuid = require("uuid/v4");
const Writable = require("readable-stream").Writable;
const messages = require("./messages");

/**
 * A StreamRequest enable to stream data to a peer using a push-based API.
 * @extends Writable
 * @author Thomas Minier
 * @example
 * const foglet = getSomeFoglet();
 * const peerID = getSomePeerID();
 *
 * const stream = foglet.streamUnicast(peerID);
 * stream.write('Hello');
 * stream.write(' world!');
 * stream.end();
 */
class StreamRequest extends Writable {
  /**
   * Constructor
   * @param {function} send - Function called to send a message
   */
  constructor(send) {
    super({
      objectMode: true,
    });
    this._id = uuid();
    this._send = send;
    this._trailers = [];
    this._last_id = undefined;
  }

  /**
   * Add a trailer.
   * All trailers will be sent after the stream is closed, so this method can be called ny number of times
   * before the `end` method is called.
   * @param {*} value - The trailing data
   * @return {void}
   */
  addTrailer(value) {
    this._trailers.push(value);
  }

  /**
   * Destroy the stream and emit an error on the `error` event.
   * This error will be propagated to peer(s) that which data was streamed, and the associated output stream
   * will also be destroyed.
   * @param {string} error - The error responsible for the stream's destruction
   */
  destroy(error) {
    this._last_id = this._send(
      messages.StreamMessageError(this._id, error),
      null,
      this._last_id,
    );
    super.destroy(error);
  }

  /**
   * @private
   */
  _write(msg, encoding, callback) {
    this._last_id = this._send(
      messages.StreamMessageChunk(this._id, msg),
      null,
      this._last_id,
    );
    callback();
    return this._last_id;
  }

  /**
   * Send trailers if presents & close the transmission
   * @private
   */
  _final(callback) {
    if (this._trailers.length > 0) {
      this._last_id = this._send(
        messages.StreamMessageTrailers(this._id, this._trailers),
        null,
        this._last_id,
      );
    }
    this._last_id = this._send(
      messages.StreamMessageEnd(this._id),
      null,
      this._last_id,
    );
    callback();
  }
}

export default StreamRequest;
