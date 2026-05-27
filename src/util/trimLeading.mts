/**
 * Removes the leading occurrence of this string from the input value.
 *
 * If the input does not start with this string, it is returned unchanged.
 */
export function trimLeading(this: string, value: string) {
  return value.startsWith(this) ? value.slice(this.length) : value;
}
