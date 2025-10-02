/**
 * Combines multiple iterators into a single generator that yields values
 * sequentially from each iterator in the order they are provided.
 *
 * This function acts like a "flattening concatenation" of iterators. It does
 * not merge or interleave values; instead, it exhausts the first iterator, then
 * moves on to the second, and so on, until all iterators are consumed.
 *
 * The resulting generator is itself iterable and can be spread, looped over,
 * or converted into an array.
 *
 * @typeParam T - The type of elements produced by the iterators.
 *
 * @param args - One or more {@link IterableIterator} objects that produce
 * values of type `T`. These iterators will be consumed in order.
 *
 * @yields T - The values produced by each of the input iterators, in sequence.
 *
 * @example
 * ```ts
 * function* numbersA() {
 *   yield 1;
 *   yield 2;
 * }
 *
 * function* numbersB() {
 *   yield 3;
 *   yield 4;
 * }
 *
 * // Combine two generators
 * const combined = combineIterators(numbersA(), numbersB());
 *
 * console.log([...combined]);
 * // Output: [1, 2, 3, 4]
 * ```
 *
 * @example
 * ```ts
 * // Combining iterators of strings
 * function* words() {
 *   yield "hello";
 *   yield "world";
 * }
 *
 * function* punctuation() {
 *   yield "!";
 * }
 *
 * const combined = combineIterators(words(), punctuation());
 *
 * for (const value of combined) {
 *   console.log(value);
 * }
 * // Output:
 * // hello
 * // world
 * // !
 * ```
 */
export function* combineIterators<T>(...args: IterableIterator<T>[]) {
  for (const iter of args) {
    yield* iter;
  }
}
