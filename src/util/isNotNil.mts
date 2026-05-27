/**
 * Type guard that filters out `null` and `undefined` values.
 */
export const isNotNil = <T,>(value: T): value is NonNullable<T> =>
  value != null;
