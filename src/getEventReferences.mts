/**
 * Retrieves the event references from a document.
 *
 * @param cur - The document to retrieve event references from.
 * @returns The event references of the document.
 */
export const getEventReferences = ({ event_references }: Document) =>
  event_references;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getEventReferences", () => {
    it("gets field", () => {
      const event_references = {};
      expect(getEventReferences({ event_references } as any)).toBe(
        event_references
      );
    });
  });
}
/* v8 ignore stop */
