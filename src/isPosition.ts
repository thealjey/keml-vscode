/**
 * Checks whether a given attribute name represents a **position attribute**.
 *
 * This function returns `true` if the name is either `"position"` or
 * `"x-position"`.
 *
 * @param name - The attribute name to test.
 * @returns `true` if the name is a position attribute, otherwise `false`.
 *
 * @example
 * ```ts
 * isPosition("position");   // true
 * isPosition("x-position"); // true
 * isPosition("top");        // false
 * ```
 */
export const isPosition = (name: string) =>
  name === "position" || name === "x-position";
