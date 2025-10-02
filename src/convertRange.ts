import { Range } from "vscode";
import { Range as LSRange } from "vscode-html-languageservice";
import { convertPosition } from "./convertPosition";

/**
 * Converts a range object from the HTML language service format
 * ({@link LSRange}) into a VS Code API {@link Range}.
 *
 * Both types represent a span of text within a document, defined by a start
 * and end position. However, the `vscode-html-languageservice` `Range` type
 * is a plain object, whereas the VS Code API requires an instance of its
 * {@link Range} class.
 *
 * This function adapts the format so that ranges produced by the HTML
 * language service can be consumed directly by VS Code APIs (e.g., for
 * diagnostics, highlights, or code actions).
 *
 * @param range - A {@link LSRange} from the HTML language service, consisting
 *                of `start` and `end` {@link LSPosition} objects.
 *
 * @returns A new VS Code {@link Range} instance with equivalent start and end
 *          positions.
 *
 * @example
 * ```ts
 * import { Range as LSRange } from "vscode-html-languageservice";
 *
 * const lsRange: LSRange = {
 *   start: { line: 1, character: 5 },
 *   end: { line: 1, character: 10 }
 * };
 *
 * const vsRange = convertRange(lsRange);
 * console.log(vsRange.start.line, vsRange.end.character); // 1, 10
 * ```
 */
export const convertRange = (range: LSRange) =>
  new Range(convertPosition(range.start), convertPosition(range.end));
