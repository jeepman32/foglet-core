import EventEmitter from "events";

/**
 * AbstractNetwork represents an abstract network layer
 * @abstract
 * @author Grall Arnaud (Folkvir)
 */
abstract class AbstractNetwork extends EventEmitter {
  rps: AbstractNetwork;
  options: any;
  id: any;
  /**
   * Constructor
   * @param {Object} options - Additional options used to build the network
   */
  constructor(options: any) {
    super();
    this.rps = this.buildRPS(options);
    this.options = options;
    // make a unique id of this network
    this.id = this.rps.PEER;
  }

  /**
   * The in-view ID of the peer in the network
   * @return {string} The in-view ID of the peer
   */
  get inViewId(): string {
    throw new Error("A valid network must implement a inViewId getter");
  }

  /**
   * The out-view ID of the peer in the network
   * @return {string} The out-view ID of the peer
   */
  get outViewId(): string {
    throw new Error("A valid network must implement a outViewId getter");
  }

  /**
   * Build the RPS for this network.
   * Subclasses of {@link AbstractNetwork} **must** implement this method.
   * @param {Object} options - Options used to build the RPS
   * @return {*} The network used as RPS/overlay
   */
  private buildRPS(options: ErrorOptions | undefined) {
    throw new Error(
      "A valid network must implement a _buildRPS method using options",
      options,
    );
  }

  /**
   * Get the IDs of all available neighbours
   * @param  {integer} limit - Max number of neighbours to look for
   * @return {string[]} Set of IDs for all available neighbours
   */
  public getNeighbours(limit?: number): string[] {
    throw new Error(
      "A valid network must implement a getNeighbours method with limit",
      typeof limit === "number" ? {} : limit,
    );
  }
}

export default AbstractNetwork;
