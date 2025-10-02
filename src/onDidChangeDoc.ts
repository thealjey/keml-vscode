import { TextDocument } from "vscode";
import { setDocs } from "./setDocs";

/**
 * Handles changes to a text document by updating the internal document cache.
 *
 * This function is intended to be called when a `TextDocument` is modified in
 * the editor.
 * It delegates to `setDocs`, ensuring that the document is parsed and stored in
 * the internal cache with `overwrite` set to `true`.
 *
 * @param doc - The VS Code `TextDocument` that has changed.
 *
 * @example
 * ```ts
 * import { onDidChangeDoc } from "./onDidChangeDoc";
 * import { TextDocument } from "vscode";
 *
 * onDidChangeDoc(vscodeDoc);
 * ```
 */
export const onDidChangeDoc = (doc: TextDocument) => setDocs(doc, true);
