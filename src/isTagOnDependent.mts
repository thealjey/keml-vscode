import { isOnDependent } from "./isOnDependent.mts";

const onDependentTags = new Map([
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
 * Determines whether an attribute is normally dependent on the presence of the
 * "on" attribute.
 * Some attributes with the same name may be allowed on certain HTML tags
 * independently of "on".
 *
 * @param tag - The HTML tag to check against the whitelist of exceptions.
 * @param name - The attribute name to check.
 * @returns A boolean indicating if the attribute would normally be dependent on
 *          "on".
 */
export const isTagOnDependent = (tag: string, name: string) => {
  if (extern.isOnDependent(name)) {
    return true;
  }

  let tags = onDependentTags.get(name);
  if (tags) {
    return !tags.includes(tag);
  }

  if (name.startsWith("x-") && (tags = onDependentTags.get(name.slice(2)))) {
    return !tags.includes(tag);
  }

  return false;
};

let extern = { isOnDependent };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("isTagOnDependent", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns true if isOnDependent(name) is true", () => {
      extern.isOnDependent = fn(() => true);
      const result = isTagOnDependent("a", "href");
      expect(result).toBe(true);
    });

    it("returns true if name has tags and tag is not included", () => {
      extern.isOnDependent = fn(() => false);
      const result = isTagOnDependent("div", "href");
      expect(result).toBe(true);
    });

    it("returns false if name has tags and tag is included", () => {
      extern.isOnDependent = fn(() => false);
      const result = isTagOnDependent("a", "href");
      expect(result).toBe(false);
    });

    it("returns true if name starts with x- and sliced tags do not include tag", () => {
      extern.isOnDependent = fn(() => false);
      const result = isTagOnDependent("div", "x-href");
      expect(result).toBe(true);
    });

    it("returns false if name starts with x- and sliced tags include tag", () => {
      extern.isOnDependent = fn(() => false);
      const result = isTagOnDependent("a", "x-href");
      expect(result).toBe(false);
    });

    it("returns false if name is not found in onDependentTags", () => {
      extern.isOnDependent = fn(() => false);
      const result = isTagOnDependent("div", "unknownAttr");
      expect(result).toBe(false);
    });
  });
}
/* v8 ignore stop */
