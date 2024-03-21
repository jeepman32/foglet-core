import AbstractNetwork from "./../abstract/abstract-network";
import Cyclon from "./cyclon/cyclon";
import merge from "lodash.merge";

/**
 * CyclonAdapter adapts the usage of a Cyclon RPS in the foglet library.
 * @extends AbstractNetwork
 * @author Grall Arnaud (Folkvir)
 */
class CyclonAdapter extends AbstractNetwork {
  constructor(options) {
    super(
      merge(
        {
          webrtc: {
            // add WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            config: { iceServers: [] }, // define iceServers in non local instance
          },
          origins: "*",
        },
        options,
      ),
    );
  }

  /**
   * Build a Spray RPS
   * @param {Object} options - Options used to build the RPS
   * @return {Spray} The Spray network
   */
  buildRPS(options) {
    // if webrtc options specified: create object config for Spray
    const cyclonOptions = merge({ config: options.webrtc }, options);
    return new Cyclon(cyclonOptions);
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
   * Get the IDs of all available neighbours with or without their suffix -I or -O
   * @param  {Boolean} transform - transform IDs into reachable ids to used for send messages => (peer) => peer-O
   * @return {String[]} Set of IDs for all available neighbours
   */
  getReachableNeighbours(transform = true) {
    return this.rps.uniqNeighbours(transform);
  }

  /**
   * Get the IDs of all available neighbours with or without their suffix -I or -O
   * @param  {Integer} limit - Max number of neighbours to look for
   * @return {String[]} Set of IDs for all available neighbours
   */
  getNeighbours(limit = undefined) {
    return this.rps.getPeers(limit);
  }

  /**
   * Get the IDs of all available neighbours
   * @return {String[]} Set of IDs for all available neighbours
   */
  getArcs() {
    const arcs = this.rps.neighbours();
    const i = arcs.inview.map((entry) => entry.peer);
    const o = arcs.inview.map((entry) => entry.peer);
    return i.concat(o);
  }
}

export default CyclonAdapter;
