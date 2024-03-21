/**
 * Get a function thta build a StreamMessage with a specific type
 * @private
 * @param {string} type - Message's type
 */
const StreamMessage = (type) => {
  return (id, payload) => {
    return {
      id,
      type,
      payload,
    };
  };
};

/**
 * A message send with a chunk of data
 * @private
 */
const StreamMessageChunk = StreamMessage("chunk");

/**
 * A message send with trailing data
 * @private
 */
const StreamMessageTrailers = StreamMessage("trailers");

/**
 * A message that close a transmission
 * @private
 */
const StreamMessageEnd = StreamMessage("end");

/**
 * A message that signal an error
 * @private
 */
const StreamMessageError = StreamMessage("error");

export default {
  StreamMessageChunk,
  StreamMessageTrailers,
  StreamMessageEnd,
  StreamMessageError,
};
