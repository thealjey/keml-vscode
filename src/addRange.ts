import { Range } from "vscode";

/**
 * Adds a {@link Range} to a collection of ranges grouped by string keys.
 *
 * This utility updates a {@link Map} where each key corresponds to a list of
 * ranges. If the key already exists, the new range is appended to the existing
 * array. If the key does not exist, a new array is created and stored.
 *
 * This function is typically used to build mappings of action names
 * (e.g., event, state, or result identifiers) to their corresponding source
 * code locations within a document.
 *
 * @param store - A {@link Map} from string keys to arrays of {@link Range}
 *                objects. The map will be updated in place.
 * @param key - The string key under which the range should be stored.
 *              If falsy (e.g. `""`), the function does nothing.
 * @param range - The {@link Range} object representing the span of text to
 *                associate with the given key.
 *
 * @example
 * ```ts
 * import { Range } from "vscode";
 *
 * const store = new Map<string, Range[]>();
 * const key = "foo";
 * const range = new Range(0, 0, 0, 3);
 *
 * addRange(store, key, range);
 *
 * console.log(store.get("foo"));
 * // Output: [ Range { start: [Object], end: [Object] } ]
 * ```
 *
 * @example
 * ```ts
 * // Appending multiple ranges to the same key
 * const store = new Map<string, Range[]>();
 * addRange(store, "bar", new Range(0, 0, 0, 3));
 * addRange(store, "bar", new Range(1, 0, 1, 3));
 *
 * console.log(store.get("bar")?.length); // 2
 * ```
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
