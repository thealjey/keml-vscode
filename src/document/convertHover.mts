import { Hover } from "vscode";
import type { Hover as LSHover } from "vscode-html-languageservice";
import { convertDocumentation } from "./convertDocumentation.mts";
import { convertRange } from "./convertRange.mts";

/**
 * Transforms a language service hover into an editor-compatible hover,
 * optionally including a source range if available.
 */
export const convertHover = ({ contents, range }: LSHover) =>
  range ?
    new Hover(convertDocumentation(contents), convertRange(range))
  : new Hover(convertDocumentation(contents));
