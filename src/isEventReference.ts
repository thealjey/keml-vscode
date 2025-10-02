/**
 * Determines whether a given attribute name represents a **reference to an
 * event action**.
 *
 * Event references are attributes that **subscribe to previously defined named
 * actions**.
 *
 * @param name - The attribute name to check (e.g., `"on"` or `"reset"`).
 *
 * @returns `true` if the name represents an event action reference, otherwise
 *          `false`.
 *
 * @example
 * ```ts
 * isEventReference("on");      // true
 * isEventReference("x-on");    // true
 * isEventReference("reset");   // true
 * isEventReference("x-reset"); // true
 * isEventReference("if");      // false
 * ```
 */
export const isEventReference = (name: string) =>
  name === "on" || name === "x-on" || name === "reset" || name === "x-reset";
