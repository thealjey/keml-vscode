import { Uri, workspace } from "vscode";
import { onDidCreateDoc } from "./onDidCreateDoc";

/**
 * Handles the creation of a file identified by a `Uri` by opening it and
 * delegating to `onDidCreateDoc` for parsing and caching.
 *
 * This is useful when responding to file system events where only the URI of
 * the file is available, such as when a new file is added to the workspace.
 *
 * @param uri - The `Uri` of the file that was created.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidCreate } from "./onDidCreate";
 *
 * workspace.onDidCreateFiles(event => {
 *   event.files.forEach(onDidCreate);
 * });
 * ```
 */
export const onDidCreate = (uri: Uri) =>
  workspace.openTextDocument(uri).then(onDidCreateDoc);
