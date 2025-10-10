/**
 * Retrieves the result references from a document.
 *
 * @param cur - The document to retrieve result references from.
 * @returns The result references of the document.
 */
export const getResultReferences = ({ result_references }: Document) =>
  result_references;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getResultReferences", () => {
    it("gets field", () => {
      const result_references = {};
      expect(getResultReferences({ result_references } as any)).toBe(
        result_references
      );
    });
  });
}
/* v8 ignore stop */
