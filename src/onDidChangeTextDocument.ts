import { TextDocumentChangeEvent } from "vscode";
import { TextDocument } from "vscode-html-languageservice";
import { docs } from "./configure";
import { parseHTMLDocument } from "./parseHTMLDocument";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection";

/**
 * Handles changes to an open text document by updating the internal
 * representation and re-running diagnostics.
 *
 * This function listens to `TextDocumentChangeEvent`s, typically from
 * the VS Code editor. When a document changes:
 * 1. It retrieves the corresponding parsed document from the internal cache.
 * 2. Updates the internal `TextDocument` representation with the changes.
 * 3. Re-parses the HTML document to update definitions, references, and
 *    diagnostics.
 * 4. Updates the diagnostic collection to reflect any changes.
 *
 * @param event - The `TextDocumentChangeEvent` triggered by VS Code when a
 *                document is edited, containing the changed `document`
 *                and the list of `contentChanges`.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidChangeTextDocument } from "./onDidChangeTextDocument";
 *
 * workspace.onDidChangeTextDocument(onDidChangeTextDocument);
 * ```
 */
export const onDidChangeTextDocument = ({
  document,
  contentChanges,
}: TextDocumentChangeEvent) => {
  const url = document.uri.toString();
  const cur = docs.get(url);

  if (!cur || !contentChanges.length) {
    return;
  }

  const textDoc = TextDocument.update(
    cur.textDoc,
    Array.from(contentChanges),
    document.version
  );
  docs.set(url, parseHTMLDocument(document, textDoc));
  updateDiagnosticCollection();
};
