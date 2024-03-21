import AbstractNetwork from "./abstract-network";

/**
 * AbstractOverlay represents an abstract overlay
 * @abstract
 * @deprecated This class is awaiting imminent DOOM, please use {@link TManOverlay} instead
 * @extends AbstractNetwork
 * @author Grall Arnaud (Folkvir)
 */
abstract class AbstractOverlay extends AbstractNetwork {
  constructor(options: { manager: any }) {
    super(options);
    if (!options.manager) {
      // NEED A BASE (a RPS or an another overlay)
      throw new SyntaxError("Need the manager to access to other networks.");
    }
    this.manager = options.manager;
  }
}

export default AbstractOverlay;
