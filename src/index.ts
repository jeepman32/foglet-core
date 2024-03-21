import Foglet from "./foglet";
import Communication from "./network/communication/communication";
import protocol from "./fprotocol/protocol-builder";
import Signaling from "./network/signaling/signaling";
import Spray from "./network/rps/sprayAdapter";
import Cyclon from "./network/rps/cyclon-adapter";
import AbstractNetwork from "./network/abstract/abstract-network";
import AbstractOverlay from "./network/abstract/abstract-overlay";
import TManOverlay from "./network/abstract/tman-overlay";
import SimplePeerMoc from "./utils/simple-peer-moc";

export default {
  Foglet,
  protocol,
  Signaling,
  SimplePeerMoc,
  networks: {
    Spray,
    Cyclon,
  },
  communication: Communication,
  abstract: {
    rps: AbstractNetwork,
    overlay: AbstractOverlay,
    tman: TManOverlay,
  },
};
