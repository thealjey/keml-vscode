const onDependentAttributes = [
  "credentials",
  "debounce",
  "delete",
  "error",
  "get",
  "if:error",
  "if:loading",
  "once",
  "post",
  "put",
  "redirect",
  "result",
  "throttle",
];

/**
 * Determines whether an attribute is on-dependent.
 *
 * An on-dependent attribute requires the presence of an "on" attribute on the
 * same element.
 *
 * @param name - The name of the attribute to check.
 * @returns True if the attribute is on-dependent, otherwise false.
 */
export const isOnDependent = (name: string) =>
  name.startsWith("h-") ||
  onDependentAttributes.includes(name) ||
  (name.startsWith("x-") && onDependentAttributes.includes(name.slice(2)));

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isOnDependent", () => {
    it("returns true only for h-, predefined, and x- variants", () => {
      expect(isOnDependent("h-custom")).toBe(true);
      expect(isOnDependent("debounce")).toBe(true);
      expect(isOnDependent("x-throttle")).toBe(true);
      expect(isOnDependent("random")).toBe(false);
    });
  });
}
/* v8 ignore stop */
