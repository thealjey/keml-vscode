import { Range } from "vscode";
import { INVALID_PATTERN } from "./parseTokens.mts";

const NON_WHITESPACE_PATTERN = /^\S+$/;

/**
 * Adds a range to the array associated with a key in the provided store.
 *
 * @param store - Map storing arrays of ranges for each key.
 * @param key - Key for which the range should be added.
 * @param range - Range to add to the store.
 */
export const addRange = (
  store: Map<string, Range[]>,
  key: string,
  range: Range
) => {
  if (NON_WHITESPACE_PATTERN.test(key) && !INVALID_PATTERN.test(key)) {
    store.get(key)?.push(range) ?? store.set(key, [range]);
  }
};

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("addRange", () => {
    it("adds a new key or appends to an existing one for valid keys", () => {
      const store = new Map();
      const range1 = {} as any;
      const range2 = {} as any;

      addRange(store, "foo", range1);
      addRange(store, "foo", range2);

      const result = store.get("foo");
      expect(result).toEqual([range1, range2]);
    });

    it("ignores empty or whitespace-only keys", () => {
      const store = new Map();
      addRange(store, "", {} as any);
      addRange(store, "   ", {} as any);
      expect(store.size).toBe(0);
    });

    it("ignores keys containing parentheses or braces", () => {
      const store = new Map();
      addRange(store, "foo(bar)", {} as any);
      addRange(store, "{baz}", {} as any);
      expect(store.size).toBe(0);
    });
  });
}
/* v8 ignore stop */
