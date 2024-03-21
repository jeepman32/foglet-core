import AbstractMethodBuilder from "./abstract-method-builder";

/**
 * A builder specialized for unicast services
 * @extends AbstractMethodBuilder
 * @author Thomas Minier
 */
class UnicastBuilder extends AbstractMethodBuilder {
  /**
   * Build the service method used to send messages.
   * @override
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService(protocol) {
    const method = this.methodName;
    const beforeSendHook = this.beforeSendName;
    const afterSendHook = this.afterSendName;
    protocol.prototype[method] = function (id, payload) {
      const self = this;
      if (beforeSendHook in self) {
        payload = self[beforeSendHook](payload);
      }
      return new Promise(function (resolve, reject) {
        const msg = {
          protocol: self._name,
          method,
          payload,
        };
        self._sendUnicast(id, msg, resolve, reject);
        if (afterSendHook in self) {
          self[afterSendHook](payload);
        }
      });
    };
  }
}

export default UnicastBuilder;
