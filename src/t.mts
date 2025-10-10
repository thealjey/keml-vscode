/**
 * Creates a tagged template function that can later be interpolated with
 * values.
 *
 * @param strings Template string segments.
 * @param placeholders Placeholder names corresponding to template
 *                     interpolations.
 * @returns Function that takes a record of values and returns the fully
 *          interpolated string.
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

  return <R extends unknown>(values: Record<T, R>) => {
    for (i = 1; i < len; i += 2) {
      result[i] = values[placeholders[i >> 1]!];
    }

    return result.join("");
  };
};

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("t", () => {
    it("substitutes placeholders with values", () => {
      const greet = t`Hello, ${"name"}! Today is ${"day"}.`;
      expect(greet({ name: "Alice", day: "Monday" })).toBe(
        "Hello, Alice! Today is Monday."
      );
    });
  });
}
/* v8 ignore stop */
