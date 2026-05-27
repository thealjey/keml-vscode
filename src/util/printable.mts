/**
 * Converts a value into a string suitable for display.
 *
 * If the value is an array, each element is converted and joined with ", ".
 */
export const printable = (value: any): string =>
  Array.isArray(value) ?
    value.map(printable).join(", ")
  : JSON.stringify(value);
