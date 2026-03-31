import { isOnDependent } from "./isOnDependent.mts";
import { isTagDependent } from "./isTagDependent.mts";

const onDependentTags = new Map([
  ["method", ["form"]],
  [
    "name",
    [
      "a",
      "applet",
      "area",
      "button",
      "fieldset",
      "form",
      "frame",
      "iframe",
      "img",
      "input",
      "map",
      "meta",
      "object",
      "output",
      "param",
      "select",
      "slot",
      "textarea",
    ],
  ],
  [
    "value",
    [
      "button",
      "data",
      "del",
      "input",
      "ins",
      "li",
      "meter",
      "option",
      "param",
      "progress",
    ],
  ],
]);

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

    it("applies name constraints", () => {
      expect(isTagOnDependent("input", "name")).toBe(false);
      expect(isTagOnDependent("div", "name")).toBe(true);
    });

    it("applies value constraints", () => {
      expect(isTagOnDependent("input", "value")).toBe(false);
      expect(isTagOnDependent("div", "value")).toBe(true);
    });
  });
}
/* v8 ignore stop */
