import { isSseDependent } from "./isSseDependent.mts";
import { isTagDependent } from "./isTagDependent.mts";

const sseDependentTags = new Map([
  ["href", ["a", "base", "link"]],
  ["action", ["form"]],
  [
    "src",
    [
      "audio",
      "embed",
      "frame",
      "iframe",
      "img",
      "input",
      "script",
      "source",
      "track",
      "video",
    ],
  ],
]);

/**
 * Predicate that determines whether a tag is SSE-dependent for a given
 * attribute.
 */
export const isTagSseDependent = isTagDependent(
  isSseDependent,
  sseDependentTags,
);

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isTagSseDependent", () => {
    it("applies href constraints", () => {
      expect(isTagSseDependent("a", "href")).toBe(false);
      expect(isTagSseDependent("div", "href")).toBe(true);
    });

    it("applies action constraints", () => {
      expect(isTagSseDependent("form", "action")).toBe(false);
      expect(isTagSseDependent("div", "action")).toBe(true);
    });

    it("applies src constraints", () => {
      expect(isTagSseDependent("img", "src")).toBe(false);
      expect(isTagSseDependent("div", "src")).toBe(true);
    });
  });
}
/* v8 ignore stop */
