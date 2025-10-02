import { Location, Range } from "vscode";
import { docs } from "./configure";

/**
 * Collects all locations in all documents where a given action can be found.
 *
 * Iterates over all parsed documents and uses the provided resolver function to
 * retrieve ranges for the specified value. Returns a list of {@link Location}
 * objects pointing to every occurrence of the value in the workspace.
 *
 * @param value - The name of the action to locate.
 * @param resolver - A function that takes a {@link ParsedDocument} and returns
 *                   a `Map<string, Range[]>` representing the locations of
 *                   actions.
 *
 * @returns An array of {@link Location} objects corresponding to each
 *          occurrence of the value across all documents.
 *
 * @example
 * ```ts
 * import { getLocations } from "./getLocations";
 *
 * const locations = getLocations("saveData", ...);
 * console.log(locations); // [Location, Location, ...]
 * ```
 */
export const getLocations = (
  value: string,
  resolver: (cur: ParsedDocument) => Map<string, Range[]>
) => {
  const result = [];
  let ranges, range;

  for (const cur of docs.values()) {
    if ((ranges = resolver(cur).get(value))) {
      for (range of ranges) {
        result.push(new Location(cur.doc.uri, range));
      }
    }
  }

  return result;
};
