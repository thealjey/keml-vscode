import type { DefinitionProvider } from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies definition locations for symbols in workspace documents.
 *
 * Enables "Go to Definition" navigation in the editor.
 * May return no result if cancelled or unsupported at the given position.
 */
export const definitionProvider: DefinitionProvider = {
  provideDefinition({ uri }, position, { isCancellationRequested }) {
    if (!isCancellationRequested) {
      return documents.get(uri.toString())?.provideDefinition(position);
    }
  },
};
