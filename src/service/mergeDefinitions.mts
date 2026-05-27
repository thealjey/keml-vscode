import { eqIn } from "../util/eqIn.mts";

/**
 * Deeply merges two definition objects.
 *
 * Primitive values and incompatible types are overwritten by values from the
 * second object.
 * Nested objects are merged recursively.
 */
const mergeDefinition = <T extends Record<string, any>>(
  left: T,
  right: T,
): T => {
  const result = { ...left };
  let item;

  for (const key in right) {
    item = right[key];
    result[key] =
      (
        item == null ||
        typeof item !== "object" ||
        typeof left[key] !== typeof item
      ) ?
        item
      : Array.isArray(item) ? (mergeDefinitions(left[key], item) as any)
      : mergeDefinition(left[key], item);
  }

  return result;
};

/**
 * Adds a definition to a list, or merges it with an existing entry if one
 * matches.
 *
 * If a matching item exists, it is replaced with a merged version of both
 * entries.
 * Otherwise, the new item is appended.
 */
const addDefinition = <T extends Record<string, any>>(items: T[], item: T) => {
  const i = items.findIndex(eqIn, ["name", item]);

  i < 0 ?
    items.push(item)
  : items.splice(i, 1, mergeDefinition(items[i]!, item));

  return items;
};

/**
 * Merges two arrays of definition objects by combining entries with the same
 * name.
 *
 * Conflicting entries are merged, with values from the second array taking
 * precedence.
 */
export const mergeDefinitions = <T extends Record<string, any>>(
  left: T[],
  right: T[],
): T[] => right.reduce(addDefinition, left.slice());
