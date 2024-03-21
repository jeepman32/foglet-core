import CommunicationProtocol from "./communication-protocol";

/**
 * AbstractUnicast represents an abstract unicast protocol.
 * @abstract
 * @extends CommunicationProtocol
 * @author Thomas Minier
 */
class AbstractUnicast extends CommunicationProtocol {
  /**
   * Constructor
   * @param  {AbstractNetwork} source - The source RPS/overlay
   * @param  {string} protocol - The name of the unicast protocol
   */
  constructor(source, protocol) {
    super(source, `foglet-unicast-protocol-${protocol}`);
  }
}

export default AbstractUnicast;
