const onDependentAttributes = [
  "debounce",
  "throttle",
  "credentials",
  "result",
  "error",
  "redirect",
  "once",
  "if:loading",
  "if:error",
  "get",
  "post",
  "put",
  "delete",
];

/**
 * Checks whether a given attribute name is **dependent on an `on` attribute**.
 *
 * An attribute is considered "on-dependent" if it either:
 * - Starts with `"h-"`, or
 * - Matches one of the predefined dependent names, or
 * - Starts with `"x-"` and the remainder matches a predefined dependent name.
 *
 * @param name - The attribute name to test.
 * @returns `true` if the attribute is dependent on `on`, otherwise `false`.
 *
 * @example
 * ```ts
 * isOnDependent("debounce");   // true
 * isOnDependent("h-custom");   // true
 * isOnDependent("x-throttle"); // true
 * isOnDependent("random");     // false
 * ```
 */
export const isOnDependent = (name: string) =>
  name.startsWith("h-") ||
  onDependentAttributes.includes(name) ||
  (name.startsWith("x-") && onDependentAttributes.includes(name.slice(2)));
