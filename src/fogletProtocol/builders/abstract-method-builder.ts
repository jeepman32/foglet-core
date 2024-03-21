import utils from "../utils";

/**
 * Apply hooks on a message in reduce fashion.
 * Hooks may return a new message. If it's not the case, the previous message is used for the next reduce step.
 * @private
 * @param  {function[]} hooks - Set of hooks
 * @return {function} A function that apply the set of hooks to a message
 */
const reduceHooks =
  (hooks: function[]): function =>
  (msg) => {
    let tmp;
    return hooks.reduce((prev, hook) => {
      tmp = hook(prev);
      if (tmp === undefined || tmp === null) {
        return prev;
      }
      return tmp;
    }, msg);
  };

/**
 * An AbstractBuilder defines an abstract class capable of builiding a service method.
 * It defines, in the prototype of a protocol subclass:
 * * The service method, used to send messages.
 * * The service handler, used to handle reception of messages for this service.
 * * The service hooks, executed before/after a message is sent/recevied.
 * @abstract
 * @author Thomas Minier
 */
class AbstractMethodBuilder {
  private serviceName: string;
  private camelCasedName: string;
  private capitalizedCamelCase: string;
  /**
   * Constructor
   * @param  {string} serviceName - The name of the service
   */
  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.camelCasedName = utils.camelCase(this.serviceName);
    this.capitalizedCamelCase = utils.capitalize(this.camelCasedName);
  }

  get methodName() {
    return this.camelCasedName;
  }

  get handlerName() {
    return `_${this.camelCasedName}`;
  }

  get beforeSendName() {
    return `_beforeSend${this.capitalizedCamelCase}`;
  }

  get beforeReceiveName() {
    return `_beforeReceive${this.capitalizedCamelCase}`;
  }

  get afterSendName() {
    return `_afterSend${this.capitalizedCamelCase}`;
  }

  get afterReceiveName() {
    return `_afterReceive${this.capitalizedCamelCase}`;
  }

  /**
   * Build the service method used to send messages.
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  buildService(protocol: function): void {
    throw new Error(
      "A valid Builder must implement a valid buildService method",
    );
  }

  /**
   * Build the service handler
   * @param  {function} protocol - The protocol class
   * @param  {function} handler  - The callback used when a message is received for this service
   * @return {void}
   */
  buildHandler(protocol: function, handler: function): void {
    protocol.prototype[this.handlerName] = handler;
  }

  /**
   * Build the before hooks for this service.
   * @param  {function} protocol - The protocol class
   * @param  {Object} beforeHooks - The hooks executed before a message is sent/received
   * @return {void}
   */
  buildBeforeHooks(protocol: function, beforeHooks: object): void {
    if (beforeHooks.send.length > 0) {
      protocol.prototype[this.beforeSendName] = reduceHooks(beforeHooks.send);
    }
    if (beforeHooks.receive.length > 0) {
      protocol.prototype[this.beforeReceiveName] = reduceHooks(
        beforeHooks.receive,
      );
    }
  }

  /**
   * Build the after hooks for this service.
   * @param  {function} protocol - The protocol class
   * @param  {Object} afterHooks - The hooks executed after a message is sent/received
   * @return {void}
   */
  buildAfterHooks(protocol: function, afterHooks: object): void {
    if (afterHooks.send.length > 0) {
      protocol.prototype[this.afterSendName] = reduceHooks(afterHooks.send);
    }
    if (afterHooks.receive.length > 0) {
      protocol.prototype[this.afterReceiveName] = reduceHooks(
        afterHooks.receive,
      );
    }
  }
}

export default AbstractMethodBuilder;
