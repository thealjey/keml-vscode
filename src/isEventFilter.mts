/**
 * Determines whether a name corresponds to an event filter.
 *
 * @param name - The name to check.
 * @returns True if the name represents an event filter, otherwise false.
 */
export const isEventFilter = (name: string) =>
  name.startsWith("event:") || name.startsWith("x-event:");

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isEventFilter", () => {
    it("returns true only for names starting with 'event:' or 'x-event:'", () => {
      expect(isEventFilter("event:click")).toBe(true);
      expect(isEventFilter("x-event:submit")).toBe(true);
      expect(isEventFilter("on:click")).toBe(false);
    });
  });
}
/* v8 ignore stop */
