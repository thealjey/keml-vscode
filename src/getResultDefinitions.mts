/**
 * Retrieves the result definitions from a document.
 *
 * @param cur - The document to retrieve result definitions from.
 * @returns The result definitions of the document.
 */
export const getResultDefinitions = ({ result_definitions }: Document) =>
  result_definitions;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getResultDefinitions", () => {
    it("gets field", () => {
      const result_definitions = {};
      expect(getResultDefinitions({ result_definitions } as any)).toBe(
        result_definitions
      );
    });
  });
}
/* v8 ignore stop */
