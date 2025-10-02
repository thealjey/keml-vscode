/**
 * Deeply merges two objects, combining nested objects and arrays.
 *
 * For each key in `right`:
 * - If the value is `null`/`undefined` or not an object, it replaces the value
 *   in `left`.
 * - If both values are arrays, they are merged using {@link mergeDefinitions}.
 * - If both values are objects, they are merged recursively using
 *   {@link mergeDefinition}.
 *
 * @param left - The base object to merge into.
 * @param right - The object whose properties will be merged into `left`.
 * @returns A new object containing the merged values of `left` and `right`.
 *
 * @example
 * ```ts
 * const a = { foo: { x: 1 }, arr: [ { name: 'a' } ] };
 * const b = { foo: { y: 2 }, arr: [ { name: 'a', z: 3 } ] };
 * mergeDefinition(a, b);
 * // { foo: { x: 1, y: 2 }, arr: [ { name: 'a', z: 3 } ] }
 * ```
 */
const mergeDefinition = <T extends Record<string, any>>(
  left: T,
  right: T
): T => {
  const result = { ...left };
  let el;

  for (const key in right) {
    el = right[key];
    result[key] =
      el == null || typeof el !== "object" || typeof left[key] !== typeof el
        ? el
        : Array.isArray(el)
        ? (mergeDefinitions(left[key], el) as any)
        : mergeDefinition(left[key], el);
  }

  return result;
};

/**
 * Merges two arrays of objects by `name` property.
 *
 * - If an element in `right` has a `name` not found in `left`, it is appended.
 * - If an element in `right` matches a `name` in `left`, the two elements are
 *   merged using {@link mergeDefinition}.
 *
 * @param left - The base array to merge into.
 * @param right - The array whose elements will be merged into `left`.
 * @returns A new array containing merged elements from both `left` and `right`.
 *
 * @example
 * ```ts
 * const a = [{ name: 'foo', data: { x: 1 } }];
 * const b = [{ name: 'foo', data: { y: 2 } }, { name: 'bar', data: { z: 3 } }];
 * mergeDefinitions(a, b);
 * // [
 * //   { name: 'foo', data: { x: 1, y: 2 } },
 * //   { name: 'bar', data: { z: 3 } }
 * // ]
 * ```
 */
export const mergeDefinitions = <T extends Record<string, any>>(
  left: T[],
  right: T[]
): T[] => {
  const result = left.slice();
  const lLen = left.length;
  const rLen = right.length;

  for (let r = 0, l, el; r < rLen; ++r) {
    el = right[r]!;
    l = lLen;
    while (l--) {
      if (left[l]!["name"] === el["name"]) {
        break;
      }
    }
    if (l === -1) {
      result.push(el);
    } else {
      result.splice(l, 1, mergeDefinition(left[l]!, el));
    }
  }

  return result;
};
