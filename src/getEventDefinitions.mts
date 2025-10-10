/**
 * Retrieves the event definitions from a document.
 *
 * @param cur - The document to retrieve event definitions from.
 * @returns The event definitions of the document.
 */
export const getEventDefinitions = ({ event_definitions }: Document) =>
  event_definitions;

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getEventDefinitions", () => {
    it("gets field", () => {
      const event_definitions = {};
      expect(getEventDefinitions({ event_definitions } as any)).toBe(
        event_definitions
      );
    });
  });
}
/* v8 ignore stop */
