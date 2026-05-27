/**
 * Checks whether the value of a specific property matches between two objects.
 *
 * Uses loose equality for comparison.
 */
export function eqIn<K extends PropertyKey>(
  this: [K, Record<K, any>],
  value: Record<K, any>,
): boolean {
  return this[1][this[0]] == value[this[0]];
}
