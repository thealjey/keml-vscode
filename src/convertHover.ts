import { Hover } from "vscode";
import { Hover as LSHover } from "vscode-html-languageservice";
import { convertDocumentation } from "./convertDocumentation";
import { convertRange } from "./convertRange";

/**
 * Converts a hover object from the HTML language service format to VSCode
 * format.
 *
 * This function maps the `contents` and `range` of an {@link LSHover} to a
 * VSCode {@link Hover}, converting documentation and range to VSCode types.
 *
 * @param hover - The hover object from the HTML language service.
 * @returns A VSCode {@link Hover} object with converted contents and optional
 *          range.
 *
 * @example
 * ```ts
 * import { Hover } from "vscode";
 * import { convertHover } from "./convertHover";
 *
 * const lsHover = {
 *   contents: "This is a test",
 *   range: { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }
 * };
 *
 * const vscodeHover: Hover = convertHover(lsHover);
 * ```
 */
export const convertHover = ({ contents, range }: LSHover) =>
  range
    ? new Hover(convertDocumentation(contents), convertRange(range))
    : new Hover(convertDocumentation(contents));
