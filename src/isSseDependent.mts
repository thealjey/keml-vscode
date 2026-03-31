const sseDependentAttributes = [
  "credentials",
  "delete",
  "get",
  "post",
  "put",
  "result",
];

/**
 * Determines whether an attribute is sse-dependent.
 *
 * An sse-dependent attribute requires the presence of an "sse" attribute on the
 * same element.
 *
 * @param name - The name of the attribute to check.
 * @returns True if the attribute is sse-dependent, otherwise false.
 */
export const isSseDependent = (name: string) =>
  sseDependentAttributes.includes(name) ||
  (name.startsWith("x-") && sseDependentAttributes.includes(name.slice(2)));

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isSseDependent", () => {
    it("returns true only for predefined, and x- variants", () => {
      expect(isSseDependent("credentials")).toBe(true);
      expect(isSseDependent("x-delete")).toBe(true);
      expect(isSseDependent("random")).toBe(false);
    });
  });
}
/* v8 ignore stop */
