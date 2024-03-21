import { PassThrough } from "readable-stream";

/**
 * A StreamMessage enable to receive data streamed using a {@link StreamRequest}.
 * @extends PassThrough
 * @author Thomas Minier
 * @example
 * const foglet = getSomeFoglet();
 * foglet.onStreamUnicast((id, stream) => {
 *  console.log('a peer with id = ', id, ' is streaming data to me');
 *  stream.on('data', data => console.log(data));
 *  stream.on('end', () => console.log('no more data available from the stream'));
 * });
 */
class StreamMessage extends PassThrough {
  /**
   * Constructor
   */
  constructor() {
    super({
      objectMode: true,
    });
    this._trailers = null;
  }

  /**
   * Get the trailing data of the message.
   * Only populated once the `end` event has been fired.
   * @return {Array} Message trailing data
   */
  get trailers() {
    return this._trailers;
  }
}

export default StreamMessage;
