import { Position } from "vscode";
import { Position as LSPosition } from "vscode-html-languageservice";

/**
 * Converts a position object from the HTML language service format
 * ({@link LSPosition}) into a VS Code API {@link Position}.
 *
 * Both types represent a zero-based line/character position in a document,
 * but they come from different libraries and are not directly interchangeable.
 *
 * This utility ensures compatibility when working with the
 * `vscode-html-languageservice` API inside a VS Code extension by adapting
 * its position type into the form required by the VS Code editor API.
 *
 * @param pos - A {@link LSPosition} from the HTML language service,
 *              containing `line` and `character` fields (both zero-based).
 *
 * @returns A new VS Code {@link Position} instance with the same line and
 *          character values.
 *
 * @example
 * ```ts
 * import { Position as LSPosition } from "vscode-html-languageservice";
 *
 * const lsPos: LSPosition = { line: 5, character: 12 };
 * const vsPos = convertPosition(lsPos);
 *
 * console.log(vsPos.line, vsPos.character); // 5, 12
 * ```
 */
export const convertPosition = (pos: LSPosition) =>
  new Position(pos.line, pos.character);
