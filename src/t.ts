/**
 * Creates a tagged template helper that allows substituting placeholders
 * with values from a lookup object.
 *
 * This function works in two stages:
 * 1. Called as a template tag, it captures the template strings and placeholder
 *    names.
 * 2. Returns a function that, when given a record mapping placeholders to
 *    values, produces the final string with placeholders replaced.
 *
 * @template T - The union of placeholder names as string literals.
 *
 * @param strings - The literal parts of a template string.
 * @param placeholders - The placeholder names within the template string.
 * @returns A function that accepts a record mapping placeholder names to values
 *          and returns the fully interpolated string.
 *
 * @example
 * ```ts
 * const greet = t`Hello, ${"name"}! Today is ${"day"}.`;
 * const result = greet({ name: "Alice", day: "Monday" });
 * console.log(result); // "Hello, Alice! Today is Monday."
 * ```
 */
export const t = <T extends string>(
  strings: TemplateStringsArray,
  ...placeholders: T[]
) => {
  const len = strings.length + placeholders.length;
  const result = new Array(len);
  let i;

  for (i = 0; i < len; i += 2) {
    result[i] = strings[i >> 1];
  }

  return <R>(values: Record<T, R>) => {
    for (i = 1; i < len; i += 2) {
      result[i] = values[placeholders[i >> 1]!];
    }

    return result.join("");
  };
};
