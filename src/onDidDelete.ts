import { Uri } from "vscode";
import { docs } from "./configure";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection";

/**
 * Handles the deletion of a file by removing its corresponding document from
 * the in-memory cache and updating the diagnostic collection.
 *
 * This function ensures that once a file is deleted, all diagnostics associated
 * with it are cleared and the extension's state remains consistent.
 *
 * @param uri - The `Uri` of the file that was deleted.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidDelete } from "./onDidDelete";
 *
 * workspace.onDidDeleteFiles(event => {
 *   event.files.forEach(onDidDelete);
 * });
 * ```
 */
export const onDidDelete = (uri: Uri) => {
  docs.delete(uri.toString());
  updateDiagnosticCollection();
};
