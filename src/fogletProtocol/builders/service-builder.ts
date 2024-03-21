import UnicastBuilder from "./unicast-builder";
import BroadcastBuilder from "./broadcast-builder";
import AbstractMethodBuilder from "./abstract-method-builder";

/**
 * Error thrown when a service builder has an invalid configuration
 * @extends Error
 * @author Thomas Minier
 */
class ServiceBuildingError extends Error {}

/**
 * A ServiceBuilder build a service into the prototype of a protocol, including the service method, the handler & the possible hooks.
 * @author Thomas Minier
 */
class ServiceBuilder {
  private serviceName: string;
  private builder: AbstractMethodBuilder | null;
  private handler: null;
  private beforeHooks: { send: never[]; receive: never[] };
  private afterHooks: { send: never[]; receive: never[] };
  private type: null;

  /**
   * Constructor
   * @param  {string} serviceName - The name of the service
   */
  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.builder = null;
    this.handler = null;
    this.beforeHooks = {
      send: [],
      receive: [],
    };
    this.afterHooks = {
      send: [],
      receive: [],
    };
  }

  /**
   * Helper used to define the type of the service.
   * @example
   * // define an unicast service
   * myService.is.unicast();
   * // define a broadcast service
   * myService.is.broadcast();
   * @return {Object}
   */
  get is(): object {
    return {
      unicast: () => {
        this.builder = new UnicastBuilder(this.serviceName);
      },
      broadcast: () => {
        this.builder = new BroadcastBuilder(this.serviceName);
      },
    };
  }

  /**
   * Helper used to define the callback invoked when a message is received for this service.
   * @example
   * myService.on.receive((msg, reply, reject) => {
   *  if (msg.number % 2 === 0)
   *    reply('You send an even number');
   *  else
   *    reject('You send a odd number!');
   * });
   * @return {Object}
   */
  get on(): object {
    return {
      receive: (callback) => {
        this.handler = callback;
      },
    };
  }

  /**
   * Helper used to define hooks executed before a message is sent/received.
   * @example
   * // define a hook before a message is sent
   * mysService.before.send(msg => console.log(`You are going to send ${msg}`));
   *
   * // define a hook before a message is received
   * mysService.before.receive(msg => console.log(`You are about to receive ${msg}`));
   * @return {Object}
   */
  get before(): object {
    return {
      send: (callback) => this.beforeHooks.send.push(callback),
      receive: (callback) => this.beforeHooks.receive.push(callback),
    };
  }

  /**
   * Helper used to define hooks executed after a message is sent/received.
   * @example
   * // define a hook after a message is sent
   * mysService.after.send(msg => console.log(`You just send ${msg}`));
   *
   * // define a hook after a message is received
   * mysService.after.receive(msg => console.log(`You juste finished processing ${msg}`));
   * @return {Object}
   */
  get after(): object {
    return {
      send: (callback) => this.afterHooks.send.push(callback),
      receive: (callback) => this.afterHooks.receive.push(callback),
    };
  }

  /**
   * Apply the builder on a protocol subclass to build the service in it.
   * The builder must have been properly configured before calling this function, otherwise an error will be thrown.
   * A valid builder has a type and a handler set.
   * @param  {function} protocol - The protocol class
   * @return {void}
   */
  apply(protocol: function): void {
    if (!this._validate()) {
      throw new ServiceBuildingError("");
    }
    this.builder.buildService(protocol);
    this.builder.buildHandler(protocol, this.handler);
    this.builder.buildBeforeHooks(protocol, this.beforeHooks);
    this.builder.buildAfterHooks(protocol, this.afterHooks);
  }

  /**
   * Validate the builder
   * @private
   * @return {boolean} true if the builder is valid, False otherwise
   */
  _validate(): boolean {
    return this.type !== null && this.handler !== null;
  }
}

export default ServiceBuilder;
