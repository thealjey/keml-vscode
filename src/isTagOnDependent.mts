import { isOnDependent } from "./isOnDependent.mts";
import { isTagDependent } from "./isTagDependent.mts";

const onDependentTags = new Map([["method", ["form"]]]);

/**
 * Predicate that determines whether a tag is "on"-dependent for a given
 * attribute.
 */
export const isTagOnDependent = isTagDependent(isOnDependent, onDependentTags);

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isTagOnDependent", () => {
    it("applies method constraints", () => {
      expect(isTagOnDependent("form", "method")).toBe(false);
      expect(isTagOnDependent("div", "method")).toBe(true);
    });
  });
}
/* v8 ignore stop */
