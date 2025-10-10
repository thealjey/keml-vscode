/**
 * Checks whether a given name represents a result definition.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a result definition.
 */
export const isResultDefinition = (name: string) =>
  name === "result" ||
  name === "x-result" ||
  name === "error" ||
  name === "x-error";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isResultDefinition", () => {
    it("returns true only for result/error variations", () => {
      expect(isResultDefinition("result")).toBe(true);
      expect(isResultDefinition("x-result")).toBe(true);
      expect(isResultDefinition("error")).toBe(true);
      expect(isResultDefinition("x-error")).toBe(true);
      expect(isResultDefinition("other")).toBe(false);
    });
  });
}
/* v8 ignore stop */
