import { Range } from "vscode";
import { docs } from "./configure";
import { getStateValue } from "./getStateValue";

/**
 * Searches all currently tracked documents for an existing action with a given
 * name and returns its corresponding value data if found.
 *
 * This utility allows retrieving the first matching action value across all
 * documents, using provided getters for definitions and value construction.
 *
 * @param name - The name of the action to look for.
 * @param definitionsGetter - A function that, given a document, returns a map
 *                            of action names to their ranges within that
 *                            document.
 * @param valueGetter - A function that, given an action name, returns its value
 *                      data object.
 *
 * @returns The value data object for the first found matching action, or
 *          `undefined` if no such action exists.
 *
 * @example
 * ```ts
 * const stateValue = getExistingActionValue(
 *   "isLoading",
 *   getStateDefinitions,
 *   getStateValue
 * );
 * if (stateValue) {
 *   console.log(stateValue.name); // "isLoading"
 * }
 * ```
 */
export const getExistingActionValue = (
  name: string,
  definitionsGetter: (cur: ParsedDocument) => Map<string, Range[]>,
  valueGetter: (name: string) => ReturnType<typeof getStateValue>
) => {
  for (const cur of docs.values()) {
    if (definitionsGetter(cur).has(name)) {
      return valueGetter(name);
    }
  }
  return;
};
