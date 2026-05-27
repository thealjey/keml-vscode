let node: Node;

/**
 * Stores the currently active document node context.
 */
export const setNode = (value: Node) => (node = value);

/**
 * Retrieves the currently active document node context.
 */
export const getNode = () => node;
