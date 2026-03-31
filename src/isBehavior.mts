/**
 * Checks whether a given name represents a behavior.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a behavior.
 */
export const isBehavior = (name: string) =>
  name === "behavior" || name === "x-behavior";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isBehavior", () => {
    it("returns true only for 'behavior' and 'x-behavior'", () => {
      expect(isBehavior("behavior")).toBe(true);
      expect(isBehavior("x-behavior")).toBe(true);
      expect(isBehavior("top")).toBe(false);
    });
  });
}
/* v8 ignore stop */
