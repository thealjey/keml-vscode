import { isBehavior } from "./isBehavior.mts";
import { isScrollPosition } from "./isScrollPosition.mts";

/**
 * Determines whether an attribute is scroll-dependent.
 *
 * An scroll-dependent attribute requires the presence of an "scroll" attribute
 * on the same element.
 *
 * @param name - The name of the attribute to check.
 * @returns True if the attribute is scroll-dependent, otherwise false.
 */
export const isScrollDependent = (name: string) =>
  name === "relative" ||
  name === "x-relative" ||
  isBehavior(name) ||
  isScrollPosition(name);

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isScrollDependent", () => {
    it("checks matching", () => {
      expect(isScrollDependent("relative")).toBe(true);
      expect(isScrollDependent("x-relative")).toBe(true);
      expect(isScrollDependent("behavior")).toBe(true);
      expect(isScrollDependent("top")).toBe(true);
      expect(isScrollDependent("random")).toBe(false);
    });
  });
}
/* v8 ignore stop */
