import FogletProtocol from "../foglet-protocol";
import AbstractMethodBuilder from "./abstract-method-builder";

/**
 * A builder specialized for broadcast services
 * @extends AbstractMethodBuilder
 * @author Thomas Minier
 */
class BroadcastBuilder extends AbstractMethodBuilder {
  /**
   * Build the service method used to send messages.
   * @override
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService(protocol: FogletProtocol) {
    const method = this.methodName;
    const beforeSendHook = this.beforeSendName;
    const afterSendHook = this.afterSendName;
    protocol[method] = function (payload: any) {
      if (beforeSendHook in this) {
        payload = this[beforeSendHook](payload);
      }

      const msg = {
        protocol: this._name,
        method,
        payload,
      };

      this._sendBroadcast(msg);

      if (afterSendHook in this) {
        this[afterSendHook](payload);
      }
    };
  }
}

export default BroadcastBuilder;
