/**
 * Checks whether a given attribute name represents a **state action
 * reference**.
 *
 * This function returns `true` if the name is `"if"` or `"x-if"`.
 *
 * @param name - The attribute name to test.
 * @returns `true` if the name is a state reference, otherwise `false`.
 *
 * @example
 * ```ts
 * isStateReference("if");    // true
 * isStateReference("x-if");  // true
 * isStateReference("if:foo");// false
 * ```
 */
export const isStateReference = (name: string) =>
  name === "if" || name === "x-if";
