import { v4 } from "uuid";

type Resolver = (payload: unknown) => void;

/**
 * An AnswerQueue stamp messages with unique ids and allow peers to answer to service calls
 * using the `reply` and `reject` helpers.
 * @author Thomas Minier
 */
class AnswerQueue {
  private queue: Map<string, { resolve?: Resolver; reject?: Resolver }>;

  /**
   * Constructor
   */
  constructor() {
    this.queue = new Map();
  }

  /**
   * Stamp a message and connect to a promise resolved with it answer
   * @param {Object} message - The message to stamp
   * @param {Resolver} resolve - The function used to resolve the promise when the answer is received
   * @param {Resolver} reject - The function used to reject the promise when the answer is received
   * @return {Object} The stamped message
   */
  stamp<T extends object>(
    message: T,
    resolve?: Resolver,
    reject?: Resolver,
  ): T & { answerId: string } {
    const answerId = v4();

    this.queue.set(answerId, { resolve, reject });

    return { ...message, answerId };
  }

  /**
   * Resolve the answer to a message
   * @param {string} answerId - The id of the answer to resolve
   * @param {*} payload - The answer's content
   * @return {void}
   */
  resolve(answerId: string, payload: unknown) {
    if (this.queue.has(answerId)) {
      this.queue.get(answerId)?.resolve?.(payload);
      this.queue.delete(answerId);
    }
  }

  /**
   * Resolve an answer by a reject
   * @param {string} answerId - The id of the answer to reject
   * @param {*} payload - The answer's content
   * @return {void}
   */
  reject(answerId: string, payload: unknown) {
    if (this.queue.has(answerId)) {
      this.queue.get(answerId)?.reject?.(payload);
      this.queue.delete(answerId);
    }
  }
}

export default AnswerQueue;
