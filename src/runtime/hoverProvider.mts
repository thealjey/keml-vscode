import type { HoverProvider } from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies hover content for symbols in workspace documents.
 *
 * Displays contextual information at the symbol under the cursor, if supported.
 * May return no result if cancelled or unsupported at the given position.
 */
export const hoverProvider: HoverProvider = {
  provideHover({ uri }, position, { isCancellationRequested }) {
    if (!isCancellationRequested) {
      return documents.get(uri.toString())?.provideHover(position);
    }
  },
};
