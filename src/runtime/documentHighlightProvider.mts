import {
  CancellationToken,
  DocumentHighlightProvider,
  Position,
  TextDocument,
} from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies highlights for occurrences of symbols in a document.
 *
 * Used to visually indicate all references of a symbol at the current position.
 * May return no highlights if cancelled or unsupported.
 */
export const documentHighlightProvider: DocumentHighlightProvider = {
  provideDocumentHighlights(
    { uri }: TextDocument,
    position: Position,
    { isCancellationRequested }: CancellationToken,
  ) {
    if (!isCancellationRequested) {
      return documents.get(uri.toString())?.provideDocumentHighlights(position);
    }
  },
};
