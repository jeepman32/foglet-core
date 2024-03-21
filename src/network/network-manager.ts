import EventEmitter from "events";
import merge from "lodash.merge";

import Network from "./network";
import SprayAdapter from "./rps/sprayAdapter";
import CyclonAdapter from "./rps/cyclon-adapter";
import AbstractNetwork from "./abstract/abstract-network";

type Options = {
  rps: {
    type: string;
    options: {
      // options will be passed to all components of the rps
      protocol: string;
    };
  };
  overlays: never[];
} & {
  rps: {
    type: string;
    options: {
      protocol: string;
      webrtc: object;
      timeout: number;
      delta: number;
      signaling: { address: string; room: string };
    };
  };
  overlay: { options: object; overlays: OverlayConfig[] };
};

interface RPSOptions {
  protocol: string;
  signaling: { address: string; room: string };
  class: AbstractNetwork;
}

/**
 * A configuration object used to build an overlay
 * @typedef {Object} OverlayConfig
 * @property {string} name - Name of the overlay, used to access it with {@link NetworkManager#overlay}
 * @property {function} class - function used to instanciate the constructor with `new`
 * @property {Object} options - Dedicated options used to build the overlay
 * @property {string} options.protocol - Name of the protocol run by the overlay
 * @property {Object} options.signaling - Options used to configure the interactions with the signaling server
 * @property {string} options.signaling.address - URL of the signaling server
 * @property {string} options.signaling.room - Name of the room in which the application run
 * @example
 * {
 *  name: 'latencies-overlay',
 *  class: LatenciesOverlay,
 *  options: {
 *    protocol: 'foglet-latencies-overlay'
 *  }
 * }
 */

/**
 * A NetworkManager manage several distinct {@link Network} instances, i.e. a RPS and a set of overlays,
 * and allow peers to choose which network they want to interact with.
 * @extends EventEmitter
 * @author Grall Arnaud (folkvir)
 */
class NetworkManager extends EventEmitter {
  private options: Options;
  private rps: Network;
  private overlays: Map<any, any>;

  /**
   * Constructor
   * @param  {Object} options - Options used to build the networks
   * @param {Object} options.rps - Options used to configure the Random Peer Sampling (RPS) network
   * @param {string} options.rps.type - The type of RPS (`spray-wrtc` for Spray or `fcn-wrtc` for a fully connected network over WebRTC)
   * @param {Object} options.rps.options - Options by the type of RPS choosen
   * @param {string} options.rps.options.protocol - Name of the protocol run by the application
   * @param {Object} options.rps.options.webrtc - WebRTC dedicated options (see WebRTC docs for more details)
   * @param {number} options.rps.options.timeout - RPS timeout before definitively close a WebRTC connection
   * @param {number} options.rps.options.delta - RPS shuffle interval
   * @param {Object} options.rps.options.signaling - Options used to configure the interactions with the signaling server
   * @param {string} options.rps.options.signaling.address - URL of the signaling server
   * @param {string} options.rps.options.signaling.room - Name of the room in which the application run
   * @param {Object} options.overlay - Options used to configure custom overlay in addition of the RPS
   * @param {Object} options.overlay.options - Options propagated to all overlays, same as the options field used to configure the RPS.
   * @param {OverlayConfig[]} options.overlay.overlays - Set of config objects used to build the overlays
   */
  constructor(options: {
    rps: {
      type: string;
      options: {
        protocol: string;
        webrtc: object;
        timeout: number;
        delta: number;
        signaling: { address: string; room: string };
      };
    };
    overlay: { options: object; overlays: OverlayConfig[] };
  }) {
    super();
    this.options = merge(
      {
        rps: {
          type: "spray-wrtc",
          options: {
            // options will be passed to all components of the rps
            protocol: "spray-wrtc-communication",
          },
        },
        overlays: [],
      },
      options,
    );
    this.rps = this.buildRPS(this.options.rps.type, this.options.rps.options);

    // build overlay(s)
    this.overlays = new Map();
    this.buildOverlays(this.options.overlays);

    console.debug("Networks (Rps and overlays) initialized.");
  }

  /**
   * Select and get an overlay to use for communication using its name.
   * If no name is specified, the base RPS will be returned.
   * @param  {string} [name=null] - (optional) Name of the overlay to get. Default to the RPS.
   * @return {Network} Return the selected overlay/rps.
   */
  overlay(name?: string): Network {
    return !name ? this.rps : this.overlays.get(name);
  }

  /**
   * Register a middleware, with an optional priority
   * @param  {Object} middleware   - The middleware to register
   * @param  {function} middleware.in - Function applied on middleware input
   * @param  {function} middleware.out - Function applied on middleware output
   * @param  {Number} [priority=0] - (optional) The middleware priority
   * @return {void}
   */
  registerMiddleware(
    middleware: { in: function; out: function },
    priority: number = 0,
  ): void {
    this.rps.use(middleware, priority);
    this.overlays.forEach((overlay) => overlay.use(middleware, priority));
  }

  /**
   * Construct the RPS by its type and options For the moment(spray-wrtc as default)
   * @private
   * @param  {string} type    - Type of the RPS (spray-wrtc/custom/...)
   * @param  {Object} options - Options of the RPS
   * @param  {string} options.protocol - Name of the protocol run by the RPS
   * @param  {Object} options.signaling - Options used to configure the interactions with the signaling server
   * @param  {string} options.signaling.address - URL of the signaling server
   * @param  {string} options.signaling.room - Name of the room in which the application run
   * @return {Network} The constructed RPS
   */
  private buildRPS(
    type: "cyclon" | "spray-wrtc" | "custom",
    options: RPSOptions,
  ): Network {
    const rpsClass = this.chooseRps(type, options);
    const rps = new rpsClass(options);
    return new Network(rps, options.signaling, options.protocol);
  }

  /**
   * Get a RPS constructor given its type in string format
   * @private
   * @param {string} type - RPS type
   * @param {Object} options - Options to pass to the RPS
   * @return {function} The RPS constructor
   */
  private chooseRps(type: "cyclon"): CyclonAdapter;
  private chooseRps(type: "spray-wrtc"): SprayAdapter;
  private chooseRps<T extends RPSOptions>(
    type: "custom",
    options: T,
  ): T["class"];
  private chooseRps(
    type: "cyclon" | "spray-wrtc" | "custom",
    options?: RPSOptions | undefined,
  ) {
    switch (type) {
      case "cyclon":
        return CyclonAdapter;
      case "custom":
        // Force type annotation as typescript cannot infer that options, in custom type, will be populated.
        return (options as RPSOptions).class;
      case "spray-wrtc":
      default:
        return SprayAdapter;
    }
  }

  /**
   * Construct all overlays
   * @private
   * @param  {OverlayConfig[]} overlays - Set of overlay config objects
   * @return {void}
   */
  private buildOverlays(overlays: OverlayConfig[]): void {
    if (overlays.length === 0)
      console.debug("No overlays added, only the base RPS is available");
    overlays.forEach((config) => {
      this._buildOverlay(config);
    });
  }

  /**
   *
   * Build and add an overlay
   * @private
   * @throws {SyntaxError} Overlay configuration object must be a valid
   * @throws {Error} An overlay with the same name has already been registered
   * @param {OverlayConfig} overlayConfig - Overlay configuration object
   * @return {void}
   */
  _buildOverlay(overlayConfig: OverlayConfig): void {
    if (
      typeof overlayConfig !== "object" ||
      !("name" in overlayConfig) ||
      !("class" in overlayConfig)
    ) {
      throw new SyntaxError(
        "An overlay is a configuration object {name: [string], class: [function], options: [Object]}",
      );
    }
    const options = overlayConfig.options;
    if (!("protocol" in options)) {
      throw new SyntaxError(
        "An overlay configuration requires a protocol name, e;g. { protocol: [string] }",
      );
    }

    if (!("signaling" in options)) {
      console.debug(
        `[WARNING] no signaling server given for overlay "${overlayConfig.name}"! Only connections from inside the same app will be allowed!`,
      );
    }

    if (this.overlays.has(overlayConfig.name)) {
      throw new Error(
        `An overlay with the name "${overlayConfig.name}" has already been registered!`,
      );
    }
    const overlay = new overlayConfig.class(this, options);
    this.overlays.set(
      overlayConfig.name,
      new Network(overlay, options.signaling, options.protocol),
    );
  }
}

export default NetworkManager;
