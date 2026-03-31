/**
 * Creates a predicate that determines whether a tag is dependent for a given
 * name.
 *
 * A tag is considered dependent if:
 * - The name is globally marked as dependent via `isDependent`, or
 * - The name (or its `"x-"` prefixed variant) has a defined tag list in
 *   `dependentTags` and the tag is not included in that list.
 *
 * If no tag list exists for the name, the tag is treated as not dependent
 * (unless `isDependent` returns `true`).
 *
 * @param isDependent Function that marks a name as always dependent.
 * @param dependentTags Map of names to lists of allowed (non-dependent) tags.
 *
 * @returns A function `(tag, name) => boolean` that returns `true` if the tag
 *          is dependent.
 *
 * @example
 * const check = isTagDependent(isDependent, dependentTags);
 * check("a", "foo"); // → boolean
 */
export const isTagDependent =
  (
    isDependent: (name: string) => boolean,
    dependentTags: Map<string, string[]>,
    tags?: string[],
  ) =>
  (tag: string, name: string) =>
    isDependent(name) ||
    (((tags = dependentTags.get(name)) ||
      (name.startsWith("x-") && (tags = dependentTags.get(name.slice(2))))) &&
      !tags.includes(tag));

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  const test = new Map([["href", ["a"]]]);

  describe("isTagDependent", () => {
    it("true if isDependent(name) is true", () => {
      expect(isTagDependent(() => true, test)("a", "href")).toBe(true);
    });

    it("true if name has tags and tag is not included", () => {
      expect(isTagDependent(() => false, test)("div", "href")).toBe(true);
    });

    it("false if name has tags and tag is included", () => {
      expect(isTagDependent(() => false, test)("a", "href")).toBe(false);
    });

    it("isDependent overrides tag logic", () => {
      expect(isTagDependent(() => true, test)("a", "href")).toBe(true);
    });

    it("true if name starts with x- and sliced tags do not include tag", () => {
      expect(isTagDependent(() => false, test)("div", "x-href")).toBe(true);
    });

    it("false if name starts with x- and sliced tags include tag", () => {
      expect(isTagDependent(() => false, test)("a", "x-href")).toBe(false);
    });

    it("false if name is not found in dependentTags", () => {
      expect(isTagDependent(() => false, test)("div", "unknown")).toBe(false);
    });
  });
}
/* v8 ignore stop */
