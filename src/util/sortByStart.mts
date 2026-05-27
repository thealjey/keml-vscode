/**
 * Comparator that sorts items in ascending order by their `start` value.
 */
export const sortByStart = <T extends { start: number }>(a: T, b: T) =>
  a.start - b.start;
