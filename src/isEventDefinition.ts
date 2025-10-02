/**
 * Determines whether a given attribute name represents an **event action
 * definition**.
 *
 * Event definitions are attributes that declare named actions to run when
 * events occur.
 *
 * @param name - The attribute name to check.
 *
 * @returns `true` if the name represents an event action definition, otherwise
 *          `false`.
 *
 * @example
 * ```ts
 * isEventDefinition("on:click");   // true
 * isEventDefinition("x-on:submit"); // true
 * isEventDefinition("if:loading"); // false
 * ```
 */
export const isEventDefinition = (name: string) =>
  name.startsWith("on:") || name.startsWith("x-on:");
