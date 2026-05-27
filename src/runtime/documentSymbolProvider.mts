import {
  CancellationToken,
  DocumentSymbolProvider,
  TextDocument,
} from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies symbols for a document to support outline and symbol navigation
 * features.
 *
 * May return no result if the operation is cancelled or the document is
 * unsupported.
 */
export const documentSymbolProvider: DocumentSymbolProvider = {
  provideDocumentSymbols(
    { uri }: TextDocument,
    { isCancellationRequested }: CancellationToken,
  ) {
    if (!isCancellationRequested) {
      return documents.get(uri.toString())?.provideDocumentSymbols();
    }
  },
};
