/**
 * Retrieves the state references from a document.
 *
 * @param cur - The document to retrieve state references from.
 * @returns The state references of the document.
 */
export const getStateReferences = ({ state_references }: Document) =>
  state_references;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getStateReferences", () => {
    it("gets field", () => {
      const state_references = {};
      expect(getStateReferences({ state_references } as any)).toBe(
        state_references
      );
    });
  });
}
/* v8 ignore stop */
