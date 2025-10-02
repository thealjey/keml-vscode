import { TextDocument } from "vscode";
import { setDocs } from "./setDocs";

/**
 * Handles the creation of a new text document by parsing and storing it in the
 * internal cache.
 *
 * It:
 * 1. Parses the document into an internal representation.
 * 2. Adds it to the cache of tracked documents.
 * 3. Updates diagnostics for the new document.
 *
 * @param doc - The newly created `TextDocument` from VS Code.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidCreateDoc } from "./onDidCreateDoc";
 *
 * workspace.onDidOpenTextDocument(onDidCreateDoc);
 * ```
 */
export const onDidCreateDoc = (doc: TextDocument) => setDocs(doc, false);
