/**
 * Checks whether a given name represents a reference reference.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a reference reference.
 */
export const isReferenceReference = (name: string) =>
  name.startsWith("link:") ||
  name.startsWith("x-link:") ||
  name.startsWith("link:link:");

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isReferenceReference", () => {
    it("returns true only for 'link:' and 'x-link:'", () => {
      expect(isReferenceReference("link:")).toBe(true);
      expect(isReferenceReference("x-link:")).toBe(true);
      expect(isReferenceReference("link:link:")).toBe(true);
      expect(isReferenceReference("random")).toBe(false);
    });
  });
}
/* v8 ignore stop */
