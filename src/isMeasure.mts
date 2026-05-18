/**
 * Checks whether a given name represents a measure.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a measure.
 */
export const isMeasure = (name: string) =>
  name === "measure" || name === "x-measure" || name === "link:measure";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isMeasure", () => {
    it("returns true only for 'measure' and 'x-measure'", () => {
      expect(isMeasure("measure")).toBe(true);
      expect(isMeasure("x-measure")).toBe(true);
      expect(isMeasure("link:measure")).toBe(true);
      expect(isMeasure("top")).toBe(false);
    });
  });
}
/* v8 ignore stop */
