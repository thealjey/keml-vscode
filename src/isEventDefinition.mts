/**
 * Determines whether a name corresponds to an event definition.
 *
 * @param name - The name to check.
 * @returns True if the name represents an event definition, otherwise false.
 */
export const isEventDefinition = (name: string) =>
  name.startsWith("on:") || name.startsWith("x-on:");

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isEventDefinition", () => {
    it("returns true only for names starting with 'on:' or 'x-on:'", () => {
      expect(isEventDefinition("on:click")).toBe(true);
      expect(isEventDefinition("x-on:submit")).toBe(true);
      expect(isEventDefinition("if:loading")).toBe(false);
    });
  });
}
/* v8 ignore stop */
