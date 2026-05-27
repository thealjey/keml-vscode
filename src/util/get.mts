/**
 * Gets the value of the property identified by `this` from the provided object.
 */
export function get<K extends PropertyKey, T extends Partial<Record<K, any>>>(
  this: K,
  value: T,
): T[K] {
  return value[this];
}
