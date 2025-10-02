/**
 * Checks whether a given attribute name represents a **result action
 * definition**.
 *
 * This function returns `true` if the name is `"result"`, `"x-result"`,
 * `"error"`, or `"x-error"`.
 *
 * @param name - The attribute name to test.
 * @returns `true` if the name is a result definition, otherwise `false`.
 *
 * @example
 * ```ts
 * isResultDefinition("result");   // true
 * isResultDefinition("x-result"); // true
 * isResultDefinition("error");    // true
 * isResultDefinition("x-error");  // true
 * isResultDefinition("other");    // false
 * ```
 */
export const isResultDefinition = (name: string) =>
  name === "result" ||
  name === "x-result" ||
  name === "error" ||
  name === "x-error";
