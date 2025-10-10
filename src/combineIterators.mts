/**
 * Combines multiple iterators into a single iterator.
 *
 * @param args - One or more iterable iterators to combine.
 * @yields Items from each iterator in order.
 */
export function* combineIterators<T>(...args: IterableIterator<T>[]) {
  for (const iter of args) {
    yield* iter;
  }
}

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("combineIterators", () => {
    it("yields all values from multiple iterators in order", () => {
      function* a() {
        yield 1;
        yield 2;
      }
      function* b() {
        yield 3;
      }
      const result = [...combineIterators(a(), b())];
      expect(result).toEqual([1, 2, 3]);
    });
  });
}
/* v8 ignore stop */
