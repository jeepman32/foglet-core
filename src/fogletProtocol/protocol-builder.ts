import FogletProtocol from "./foglet-protocol";
import ServiceBuilder from "./builders/service-builder";
import InitBuilder from "./builders/init-builder";
import Foglet from "../foglet";

/**
 * Create a function that evaluates a tagged template to create a new subclass of {@link FogletProtocol}
 * that implements the protocol described in the template.
 * @param  {string} protocolName - The name of the protocol
 * @return {function} A function that evaluates a tagged template to create a new subclass of {@link FogletProtocol}
 * @example
 * const ExampleUnicastProtocol = defineProtocol('example-unicast-protocol')`
 *  init
 *  ${function (base) {
 *    this._base = base;
 *  }}
 *  get
 *  ${function(service) {
 *    service.is.unicast();
 *    service.on.receive(function (id, msg, reply, reject) {
 *      if (msg.number % this._base === 0)
 *        reply(`${msg.number} is a multiple of ${this._base}`);
 *      else
 *        reject(`${msg.number} is not a multiple of ${this._base}`);
 *    });
 *  }}
 *  `;
 *
 * export default ExampleUnicastProtocol;
 */
const define =
  (protocolName: string) =>
  (
    services: any[],
    ...callbacks: { [x: string]: (arg0: ServiceBuilder) => void }
  ) => {
    let builder;

    const protocolClass = class extends FogletProtocol {
      constructor(foglet: Foglet, ...args: any) {
        super(protocolName, foglet, ...args);
      }
    };

    // clean services names before building
    services
      .map((str: string) => str.trim())
      .filter((str: string | any[]) => str.length > 0)
      .forEach((name: string, index: string | number) => {
        if (name === "init" || name === "constructor") {
          builder = new InitBuilder(callbacks[index]);
        } else {
          builder = new ServiceBuilder(name);
          callbacks[index](builder);
        }
        builder.apply(protocolClass);
      });
    return protocolClass;
  };

export default define;
