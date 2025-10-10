/**
 * Retrieves the state definitions from a document.
 *
 * @param cur - The document to retrieve state definitions from.
 * @returns The state definitions of the document.
 */
export const getStateDefinitions = ({ state_definitions }: Document) =>
  state_definitions;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getStateDefinitions", () => {
    it("returns the state_definitions map from the ParsedDocument", () => {
      const state_definitions = {};
      expect(getStateDefinitions({ state_definitions } as any)).toBe(
        state_definitions
      );
    });
  });
}
/* v8 ignore stop */
