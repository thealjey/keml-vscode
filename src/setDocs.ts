import { TextDocument } from "vscode";
import { TextDocument as LSTextDocument } from "vscode-html-languageservice";
import { docs, getExclude, getInclude, getLanguageIds } from "./configure";
import { match } from "./match";
import { parseHTMLDocument } from "./parseHTMLDocument";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection";

/**
 * Adds or updates a parsed document in the internal document cache.
 *
 * This function checks whether the document should be included based on its
 * language ID and configured include/exclude patterns. If eligible, it parses
 * the document using the HTML language service and stores it in the `docs` map.
 * It also triggers an update of the diagnostic collection for all cached
 * documents.
 *
 * @param doc - The VS Code `TextDocument` to be added or updated.
 * @param overwrite - If `true`, existing entries for the same document URI will
 *                    be replaced.
 *                    If `false`, the function will not modify an existing
 *                    entry.
 *
 * @example
 * ```ts
 * import { setDocs } from "./setDocs";
 * import { TextDocument } from "vscode";
 *
 * setDocs(vscodeDoc, true);
 * ```
 */
export const setDocs = (doc: TextDocument, overwrite: boolean) => {
  const { uri, version, languageId } = doc;
  const url = uri.toString();

  if (docs.has(url) !== overwrite) {
    return;
  }

  if (
    !getLanguageIds().includes(languageId) ||
    !match(uri.path, getExclude(), getInclude())
  ) {
    return;
  }

  const textDoc = LSTextDocument.create(url, "html", version, doc.getText());

  docs.set(url, parseHTMLDocument(doc, textDoc));
  updateDiagnosticCollection();
};
