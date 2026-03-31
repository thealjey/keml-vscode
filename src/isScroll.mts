/**
 * Checks whether a given name represents a scroll.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a scroll.
 */
export const isScroll = (name: string) =>
  name === "scroll" || name === "x-scroll";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isScroll", () => {
    it("returns true only for 'scroll' and 'x-scroll'", () => {
      expect(isScroll("scroll")).toBe(true);
      expect(isScroll("x-scroll")).toBe(true);
      expect(isScroll("top")).toBe(false);
    });
  });
}
/* v8 ignore stop */
