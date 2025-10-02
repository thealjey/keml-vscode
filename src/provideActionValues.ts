import { Range } from "vscode";
import { IValueData } from "vscode-html-languageservice";
import { docs } from "./configure";

/**
 * Collects unique action values across all parsed documents and converts them
 * into a format suitable for the HTML language service.
 *
 * Iterates over every document in the workspace, extracts action names using
 * the provided resolver, and converts each unique action name into an
 * {@link IValueData} object using the provided converter function.
 *
 * @param resolver - A function that takes a {@link ParsedDocument} and returns
 *                   a `Map` of action names to their corresponding ranges.
 * @param converter - A function that converts an action name into an
 *                    {@link IValueData} object for completion or hover support.
 *
 * @returns An array of {@link IValueData} objects representing all unique
 *          actions across the current documents.
 *
 * @example
 * ```ts
 * const values = provideActionValues(
 *   doc => doc.actions, // resolver returning Map<string, Range[]>
 *   name => ({ name })   // simple converter to IValueData
 * );
 * console.log(values);
 * ```
 */
export const provideActionValues = (
  resolver: (cur: ParsedDocument) => Map<string, Range[]>,
  converter: (name: string) => IValueData
) => {
  const seen = new Set<string>();
  const result = [];
  let action;

  for (const cur of docs.values()) {
    for (action of resolver(cur).keys()) {
      if (!seen.has(action)) {
        result.push(converter(action));
        seen.add(action);
      }
    }
  }

  return result;
};
