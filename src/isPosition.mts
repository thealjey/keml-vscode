/**
 * Checks whether a given name represents a position.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a position.
 */
export const isPosition = (name: string) =>
  name === "position" || name === "x-position";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isPosition", () => {
    it("returns true only for 'position' and 'x-position'", () => {
      expect(isPosition("position")).toBe(true);
      expect(isPosition("x-position")).toBe(true);
      expect(isPosition("top")).toBe(false);
    });
  });
}
/* v8 ignore stop */
