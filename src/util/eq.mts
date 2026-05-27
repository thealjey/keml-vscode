/**
 * Checks whether a stored value equals a property value in an object.
 *
 * Uses loose equality for comparison.
 */
export function eq<K extends PropertyKey, T extends Record<K, any>>(
  this: [K, any],
  value: T,
): boolean {
  return this[1] == value[this[0]];
}
