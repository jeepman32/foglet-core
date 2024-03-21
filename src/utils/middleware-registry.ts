// TODO: Not entirely clear if this works, is useful, and can be typed properly. Revisit later.

/**
 * A Middleware registry coordintaes middleware in a foglet application
 * @author Thomas Minier
 */
class MiddlewareRegistry {
  /**
   * Constructor
   */
  constructor() {
    this._middlewares = [];
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  register(middleware, priority = 0) {
    if (!("in" in middleware) && !("out" in middleware)) {
      throw new Error(
        'A middleware must contains two functions: "in" and "out"',
      );
    }
    this._middlewares.push({
      middleware,
      priority,
    });
    this._middlewares.sort((x, y) => x.priority - y.priority);
  }

  /**
   * Apply middleware on input data
   * @param  {*} data - Input data
   * @return {*} Input data transformed by successive application of middlewares
   */
  in(data) {
    let temp;
    return this._middlewares.reduce((input, obj) => {
      temp = obj.middleware.in(input);
      if (temp !== undefined || temp !== null) {
        return temp;
      }
      return input;
    }, data);
  }

  /**
   * Apply middleware on output data
   * @param  {*} data - Output data
   * @return {*} Output data transformed by successive application of middlewares
   */
  out(data) {
    let temp;
    return this._middlewares.reduce((input, obj) => {
      temp = obj.middleware.out(input);
      if (temp !== undefined || temp !== null) {
        return temp;
      }
      return input;
    }, data);
  }
}

export default MiddlewareRegistry;
