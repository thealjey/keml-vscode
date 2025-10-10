/**
 * Checks whether a given name represents a state definition.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a state definition.
 */
export const isStateDefinition = (name: string) =>
  name.startsWith("if:") || name.startsWith("x-if:");

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isStateDefinition", () => {
    it("returns true only for names starting with 'if:' or 'x-if:'", () => {
      expect(isStateDefinition("if:loading")).toBe(true);
      expect(isStateDefinition("x-if:error")).toBe(true);
      expect(isStateDefinition("on:click")).toBe(false);
    });
  });
}
/* v8 ignore stop */
