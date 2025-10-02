/**
 * Determines whether a given attribute name represents an **event filter**.
 *
 * Event filters define conditions that must be satisfied for corresponding
 * event actions (`on:<event>` or `x-on:<event>`) to execute.
 *
 * @param name - The attribute name to check.
 *
 * @returns `true` if the name represents an event filter, otherwise `false`.
 *
 * @example
 * ```ts
 * isEventFilter("event:click");   // true
 * isEventFilter("x-event:submit"); // true
 * isEventFilter("on:click");      // false
 * ```
 */
export const isEventFilter = (name: string) =>
  name.startsWith("event:") || name.startsWith("x-event:");
