import AbstractNetwork from "./abstract/abstract-network";
import Communication from "./communication/communication";
import Signaling from "./signaling/signaling";

/**
 * Network represent a network layer with three main components:
 * * The **network** itself, which can be a RPS, like {@link SprayAdapter}, or an overlay, like {@link LatenciesOverlay}.
 * * The **signaling** part, which is a connection with a signaling server used by peers to join the network.
 * * The **communication** part, which allow a peer to send message in the network using broadcast or unicast channels.
 * @author Grall Arnaud (folkvir)
 */
class Network {
  readonly network: AbstractNetwork;
  readonly protocol: string;
  readonly signaling: Signaling;
  readonly communication: Communication;

  /**
   * Constructor
   * @param  {AbstractNetwork} network - The network layer
   * @param  {Object} signaling - Options used to build the signaling part
   * @param  {string} signaling.address - URL of the signaling server
   * @param  {string} signaling.room - Name of the room in which the application run
   * @param  {string} protocol - Name of the protocol run by the network
   */
  constructor(
    network: AbstractNetwork,
    signaling: { address: string; room: string },
    protocol: string,
  ) {
    this.network = network;
    this.protocol = protocol;
    this.signaling = new Signaling(network, signaling);
    this.communication = new Communication(network, protocol);
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  use(middleware: { in: function; out: function }, priority: number = 0): void {
    this.communication.use(middleware, priority);
  }
}

export default Network;
