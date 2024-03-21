import CommunicationProtocol from "./communication-protocol";
import Unicast from "./../unicast/unicast";
import AbstractNetwork from "../../abstract/abstract-network";

/**
 * AbstractBroadcast represents an abstract broadcast protocol.
 * @abstract
 * @extends CommunicationProtocol
 * @author Thomas Minier
 */
abstract class AbstractBroadcast extends CommunicationProtocol {
  public unicast: Unicast;
  public source: AbstractNetwork;
  public protocol: string;
  /**
   * Constructor
   * @param  {AbstractNetwork} source - The source RPS/overlay
   * @param  {string} protocol - The name of the broadcast protocol
   */
  constructor(source: AbstractNetwork, protocol: string) {
    super(source, `foglet-broadcast-protocol-${protocol}`);
    this.unicast = new Unicast(this.source, this.protocol);
    this.unicast.on("receive", (id, message) => {
      this.receive(id, message);
    });
  }

  receive(id: string, message: any) {
    throw new Error("Method not implemented.");
  }
}

export default AbstractBroadcast;
