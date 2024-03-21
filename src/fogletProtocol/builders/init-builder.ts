/**
 * An InitBuilder build the _init method for a protocol prototype.
 * @author Thomas Minier
 */
class InitBuilder {
  /**
   * Constructor
   * @param  {function} callback - The callback executed by the _init method
   */
  constructor(callback) {
    this._callback = callback;
  }

  /**
   * Apply the builder on a protocol subclass to build the _init method in it.
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  apply(protocol) {
    protocol.prototype._init = this._callback;
  }
}

export default InitBuilder;
