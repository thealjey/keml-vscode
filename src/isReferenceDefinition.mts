/**
 * Checks whether a given name represents a reference definition.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a reference definition.
 */
export const isReferenceDefinition = (name: string) =>
  name.startsWith("ref:") ||
  name.startsWith("x-ref:") ||
  name.startsWith("link:ref:");

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isReferenceDefinition", () => {
    it("returns true only for reference variations", () => {
      expect(isReferenceDefinition("ref:")).toBe(true);
      expect(isReferenceDefinition("x-ref:")).toBe(true);
      expect(isReferenceDefinition("link:ref:")).toBe(true);
      expect(isReferenceDefinition("other")).toBe(false);
    });
  });
}
/* v8 ignore stop */
