/**
 * Merges two definition objects into a single result.
 *
 * @param left Base object to merge into.
 * @param right Object providing overriding values.
 * @returns Combined object containing merged properties.
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
 * Merges two arrays of definition objects into a unified list.
 *
 * @param left Base array to merge into.
 * @param right Array providing additional or overriding entries.
 * @returns Combined array containing merged definitions.
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

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("mergeDefinitions", () => {
    it("merges nested objects and arrays", () => {
      const a = { foo: { x: 1 }, arr: [{ name: "a" }] };
      const b = { foo: { y: 2 }, arr: [{ name: "a", z: 3 }] };
      const result = (mergeDefinitions as any)([a], [b])[0];
      expect(result).toEqual({
        foo: { x: 1, y: 2 },
        arr: [{ name: "a", z: 3 }],
      });
    });

    it("overwrites with nulls and primitives", () => {
      const a = { foo: { x: 1 }, bar: 42 };
      const b = { foo: null, bar: 100 };
      const result = (mergeDefinitions as any)([a], [b])[0];
      expect(result).toEqual({ foo: null, bar: 100 });
    });

    it("adds new named elements when not found", () => {
      const a = [{ name: "foo", val: 1 }];
      const b = [{ name: "bar", val: 2 }];
      const result = mergeDefinitions(a, b);
      expect(result).toEqual([
        { name: "foo", val: 1 },
        { name: "bar", val: 2 },
      ]);
    });
  });
}
/* v8 ignore stop */
