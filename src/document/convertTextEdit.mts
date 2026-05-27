import { TextEdit } from "vscode";
import type { TextEdit as LSTextEdit } from "vscode-html-languageservice";
import { convertRange } from "./convertRange.mts";

/**
 * Transforms a language service text edit into an editor-compatible text edit.
 */
export const convertTextEdit = ({ range, newText }: LSTextEdit) =>
  new TextEdit(convertRange(range), newText);
