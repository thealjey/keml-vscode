import { Range } from "vscode";
import { isValidToken } from "./isValidToken.mts";

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
) =>
  extern.isValidToken(key) &&
  (store.get(key)?.push(range) ?? store.set(key, [range]));

let extern = { isValidToken };

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

  describe("addRange", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("adds a new key or appends to an existing one when isValidToken returns true", () => {
      const store = new Map();
      const range1 = {} as any;
      const range2 = {} as any;

      extern.isValidToken = fn(() => true);

      addRange(store, "foo", range1);
      addRange(store, "foo", range2);

      expect(extern.isValidToken).toHaveBeenCalledTimes(2);
      expect(store.get("foo")).toEqual([range1, range2]);
    });

    it("does nothing when isValidToken returns false", () => {
      const store = new Map();
      const range = {} as any;

      extern.isValidToken = fn(() => false);

      addRange(store, "badKey", range);

      expect(extern.isValidToken).toHaveBeenCalledWith("badKey");
      expect(store.size).toBe(0);
    });
  });
}
/* v8 ignore stop */
