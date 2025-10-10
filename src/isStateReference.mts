/**
 * Checks whether a given name represents a state reference.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a state reference.
 */
export const isStateReference = (name: string) =>
  name === "if" || name === "x-if";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isStateReference", () => {
    it("returns true only for 'if' and 'x-if'", () => {
      expect(isStateReference("if")).toBe(true);
      expect(isStateReference("x-if")).toBe(true);
      expect(isStateReference("if:foo")).toBe(false);
    });
  });
}
/* v8 ignore stop */
