/**
 * Retrieves the reference references from a document.
 *
 * @param cur - The document to retrieve reference references from.
 * @returns The reference references of the document.
 */
export const getReferenceReferences = ({ reference_references }: Document) =>
  reference_references;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getReferenceReferences", () => {
    it("gets field", () => {
      const reference_references = {};
      expect(getReferenceReferences({ reference_references } as any)).toBe(
        reference_references,
      );
    });
  });
}
/* v8 ignore stop */
