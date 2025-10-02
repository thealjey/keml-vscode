/**
 * Checks whether a given attribute name represents a **result action
 * reference**.
 *
 * This function returns `true` if the name is `"render"` or `"x-render"`.
 *
 * @param name - The attribute name to test.
 * @returns `true` if the name is a result reference, otherwise `false`.
 *
 * @example
 * ```ts
 * isResultReference("render");   // true
 * isResultReference("x-render"); // true
 * isResultReference("result");   // false
 * ```
 */
export const isResultReference = (name: string) =>
  name === "render" || name === "x-render";
