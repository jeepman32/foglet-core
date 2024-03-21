import { IncrementReturn } from "version-vector-with-exceptions";

const formatBroadcastMessage = (
  protocol: string,
  // I don't think these should be optional, I just think the caller's implementation is bad.
  id?: string,
  isReady?: IncrementReturn,
  payload?: unknown,
) => {
  return {
    protocol,
    id,
    isReady,
    payload,
  };
};

const formatAntiEntropyRequest = (causality) => {
  return {
    type: "MAntiEntropyRequest",
    causality,
  };
};

const formatAntiEntropyResponse = (id: string) => {
  return {
    type: "MAntiEntropyResponse",
    id,
    causality: undefined,
    nbElements: undefined,
    element: undefined,
    elements: [],
  };
};

export default {
  formatBroadcastMessage,
  formatAntiEntropyRequest,
  formatAntiEntropyResponse,
};
