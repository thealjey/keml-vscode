/**
 * Retrieves the reference definitions from a document.
 *
 * @param cur - The document to retrieve reference definitions from.
 * @returns The reference definitions of the document.
 */
export const getReferenceDefinitions = ({ reference_definitions }: Document) =>
  reference_definitions;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getReferenceDefinitions", () => {
    it("gets field", () => {
      const reference_definitions = {};
      expect(getReferenceDefinitions({ reference_definitions } as any)).toBe(
        reference_definitions,
      );
    });
  });
}
/* v8 ignore stop */
