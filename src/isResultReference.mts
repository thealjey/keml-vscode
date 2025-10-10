/**
 * Checks whether a given name represents a result reference.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a result reference.
 */
export const isResultReference = (name: string) =>
  name === "render" || name === "x-render";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isResultReference", () => {
    it("returns true only for 'render' and 'x-render'", () => {
      expect(isResultReference("render")).toBe(true);
      expect(isResultReference("x-render")).toBe(true);
      expect(isResultReference("result")).toBe(false);
    });
  });
}
/* v8 ignore stop */
