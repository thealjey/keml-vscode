import { Range } from "vscode";
import { Range as LSRange } from "vscode-html-languageservice";
import { convertPosition } from "./convertPosition.mts";

/**
 * Transforms a language service range into an editor-compatible range.
 */
export const convertRange = ({ start, end }: LSRange) =>
  new Range(convertPosition(start), convertPosition(end));
