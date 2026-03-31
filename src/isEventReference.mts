import { isScroll } from "./isScroll.mts";

/**
 * Determines whether a name corresponds to an event reference.
 *
 * @param name - The name to check.
 * @returns True if the name represents an event reference, otherwise false.
 */
export const isEventReference = (name: string) =>
  name === "on" ||
  name === "x-on" ||
  name === "reset" ||
  name === "x-reset" ||
  isScroll(name);

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isEventReference", () => {
    it("matches name", () => {
      expect(isEventReference("on")).toBe(true);
      expect(isEventReference("x-on")).toBe(true);
      expect(isEventReference("reset")).toBe(true);
      expect(isEventReference("x-reset")).toBe(true);
      expect(isEventReference("scroll")).toBe(true);
      expect(isEventReference("if")).toBe(false);
    });
  });
}
/* v8 ignore stop */
