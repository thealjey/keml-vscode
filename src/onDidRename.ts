import { Uri, workspace } from "vscode";
import { docs } from "./configure";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection";

/**
 * Handles the renaming of a file by updating the in-memory document cache and
 * refreshing diagnostics to reflect the new file URI.
 *
 * If the old document exists in the cache, it is removed and re-added under
 * the new URI, and its `TextDocument` instance is reloaded from the workspace.
 *
 * @param e - An event object containing:
 *   - `oldUri`: The original `Uri` of the file before renaming.
 *   - `newUri`: The new `Uri` of the file after renaming.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidRename } from "./onDidRename";
 *
 * workspace.onDidRenameFiles(onDidRename);
 * ```
 */
export const onDidRename = async ({
  oldUri,
  newUri,
}: {
  oldUri: Uri;
  newUri: Uri;
}) => {
  const oldUrl = oldUri.toString();
  const newUrl = newUri.toString();
  const cur = docs.get(oldUrl);

  if (!cur) {
    return;
  }

  cur.doc = await workspace.openTextDocument(newUri);

  docs.delete(oldUrl);
  docs.set(newUrl, cur);
  updateDiagnosticCollection();
};
