import { Position } from "vscode";
import type { Position as LSPosition } from "vscode-html-languageservice";

/**
 * Transforms a language service position into an editor-compatible position.
 */
export const convertPosition = ({ line, character }: LSPosition) =>
  new Position(line, character);
