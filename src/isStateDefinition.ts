/**
 * Checks whether a given attribute name represents a **state action
 * definition**.
 *
 * This function returns `true` if the name starts with `"if:"` or `"x-if:"`.
 *
 * @param name - The attribute name to test.
 * @returns `true` if the name is a state definition, otherwise `false`.
 *
 * @example
 * ```ts
 * isStateDefinition("if:loading"); // true
 * isStateDefinition("x-if:error"); // true
 * isStateDefinition("on:click");   // false
 * ```
 */
export const isStateDefinition = (name: string) =>
  name.startsWith("if:") || name.startsWith("x-if:");
