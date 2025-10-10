/**
 * Computes the difference between the first elements of two arrays/tuples.
 *
 * @param a First item containing a numeric element at index 0.
 * @param b Second item containing a numeric element at index 0.
 * @returns The result of subtracting b[0] from a[0].
 */
export const sortByZero = <T extends { 0: number }>(a: T, b: T) => a[0] - b[0];

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("sortByZero", () => {
    it("subtracts value", () => {
      expect(sortByZero([7], [5])).toBe(2);
    });
  });
}
/* v8 ignore stop */
