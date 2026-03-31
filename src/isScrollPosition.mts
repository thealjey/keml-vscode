/**
 * Checks whether a given name represents a scroll position.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a scroll position.
 */
export const isScrollPosition = (name: string) =>
  name === "top" || name === "x-top" || name === "left" || name === "x-left";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isScrollPosition", () => {
    it("checks the name", () => {
      expect(isScrollPosition("top")).toBe(true);
      expect(isScrollPosition("x-left")).toBe(true);
      expect(isScrollPosition("other")).toBe(false);
    });
  });
}
/* v8 ignore stop */
