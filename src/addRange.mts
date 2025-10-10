import { Range } from "vscode";

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
  if (key) {
    store.get(key)?.push(range) ?? store.set(key, [range]);
  }
};

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("addRange", () => {
    it("adds ranges to the map under the specified key", () => {
      const store = new Map();
      const range1 = {} as any;
      const range2 = {} as any;

      addRange(store, "foo", range1);
      addRange(store, "foo", range2);

      const result = store.get("foo");
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(range1);
      expect(result[1]).toBe(range2);

      addRange(store, "", {} as any);
      expect(store.size).toBe(1);
    });
  });
}
/* v8 ignore stop */
