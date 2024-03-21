import AbstractNetwork from "./abstract-network";
import merge from "lodash.merge";
import NetworkManager from "../network-manager";
// @ts-expect-error This package does not have types.
import TMan from "tman-wrtc";

/**
 * A TManOverlay is an abstract network used to build overlay based on the TMan network over WebRTC.
 * @see https://github.com/RAN3D/tman-wrtc for more informations on TMan.
 * @abstract
 * @extends AbstractOverlay
 * @author Thomas Minier
 */
class TManOverlay extends AbstractNetwork {
  manager: any;

  constructor(networkManager: NetworkManager, options: object) {
    super(options);
    this.manager = networkManager;
    this.rps.parent.once("open", () => {
      console.log("SON connected");
      this.rps._start();
    });
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inViewId() {
    return this.rps.getInviewId();
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outViewId() {
    return this.rps.getOutviewId();
  }

  /**
   * Get our current descriptor
   * @return {Object} The peer current descriptor
   */
  get descriptor(): object {
    return this.rps.options.descriptor;
  }

  /**
   * Update the peer descriptor
   * @param  {Object} newDescriptor - The new descriptor
   * @return {void}
   */
  set descriptor(newDescriptor: object) {
    this.rps.options.descriptor = newDescriptor;
  }

  /**
   * Build a TMan network
   * @param {Object} options - Options used to build the TMan
   * @return {TMan} The TMan network
   */
  private buildRPS(options: object): TMan {
    // if webrtc options specified: create object config for Spray
    this.options = merge({ config: options.webrtc }, options);
    const tmanOptions = merge(
      {
        descriptor: this.startDescriptor(),
        descriptorTimeout: this.descriptorTimeout(),
        ranking: this.rankingFunction(),
      },
      this.options,
    );
    return new TMan(tmanOptions, options.manager._rps._network._rps);
  }

  /**
   * Gives the start descriptor used by the TMan overlay (can be an empty object).
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @return {Object} The start descriptor used by the TMan overlay
   */
  private startDescriptor(): object {
    throw new Error(
      "A valid TMan based overlay must implement a _descriptor method to generate a base descriptor",
    );
  }

  /**
   * Give the delay **in milliseconds** after which the descriptor must be recomputed.
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @return {number} The delay **in milliseconds** after which the descriptor must be recomputed
   */
  private descriptorTimeout(): number {
    throw new Error(
      "A valid TMan based overlay must implement a _descriptorTimeout method to give the timeout on descriptors",
    );
  }

  /**
   * Compare two peers and rank them according to a ranking function.
   * This function must return `0 if peerA == peerB`, `1 if peerA < peerB` and `-1 if peerA > peerB`.
   *
   * Subclasses of {@link TManOverlay} **must** implement this method.
   * @param {*} neighbour - The neighbour to rank with
   * @param {Object} descriptorA - Descriptor of the first peer
   * @param {Object} descriptorB - Descriptor of the second peer
   * @param {TManOverlay} peerA - (optional) The overlay of the first peer
   * @param {TManOverlay} peerB - (optional) The overlay of the second peer
   * @return {integer} `0 if peerA == peerB`, `1 if peerA < peerB` and `-1 if peerA > peerB` (according to the ranking algorithm)
   */
  private rankPeers(
    neighbour: any,
    descriptorA: object,
    descriptorB: object,
    peerA: TManOverlay,
    peerB: TManOverlay,
  ): number {
    throw new Error(
      "A valid TMan based overlay must implement a _rankPeers method to rank two peers" +
        `variable: ${neighbour.toString()}${descriptorA.toString()}${descriptorB.toString()}${peerA.toString()}${peerB.toString()}`,
    );
  }

  /**
   * Utility to rank two peers
   * @private
   */
  private rankingFunction() {
    return (peer) => (a, b) =>
      this.rankPeers(peer, a.descriptor, b.descriptor, a, b);
  }

  /**
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  getNeighbours(limit: number): string[] {
    return this.rps.getPeers(limit);
  }
}

export default TManOverlay;
