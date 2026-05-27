import type { CompletionItemProvider } from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies completion suggestions for symbols in workspace documents.
 *
 * Enables autocomplete behavior in supported documents.
 * May return no results if cancelled or unsupported at the given position.
 */
export const completionProvider: CompletionItemProvider = {
  provideCompletionItems({ uri }, position, { isCancellationRequested }) {
    if (!isCancellationRequested) {
      return documents.get(uri.toString())?.provideCompletionItems(position);
    }
  },
};
