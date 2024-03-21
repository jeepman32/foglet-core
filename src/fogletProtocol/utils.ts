const camelCase = (string: string) =>
  string
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, "");

const capitalize = (string: string) =>
  string[0]?.toUpperCase() + string.slice(1);

/**
 * Get the name of a service method
 */
const generateMethodName = camelCase;

/**
 * Get the name of a handler
 */
const generateHandlerName = (method: string) => `_${camelCase(method)}`;

/**
 * Get the name of a before hook for a service method
 */
const generateBeforeSendName = (method: string) =>
  `_beforeSend${capitalize(camelCase(method))}`;

/**
 * Get the name of a before hook for a handler
 */
const generateBeforeReceiveName = (method: string) =>
  `_beforeReceive${capitalize(camelCase(method))}`;
/**
 * Get the name of a before hook for a service method
 */
const generateAfterSendName = (method: string) =>
  `_afterSend${capitalize(camelCase(method))}`;
/**
 * Get the name of an after hook for a handler
 */
const generateAfterReceiveName = (method: string) =>
  `_afterReceive${capitalize(camelCase(method))}`;

export default {
  camelCase,
  capitalize,
  methodName: generateMethodName,
  handlerName: generateHandlerName,
  beforeSendName: generateBeforeSendName,
  beforeReceiveName: generateBeforeReceiveName,
  afterSendName: generateAfterSendName,
  afterReceiveName: generateAfterReceiveName,
};
