/**
 * Combines multiple iterators into a single sequential iterator.
 *
 * Values are yielded in the order of the provided iterators.
 */
export function* combineIterators<T>(...args: IterableIterator<T>[]) {
  for (const iter of args) {
    yield* iter;
  }
}
