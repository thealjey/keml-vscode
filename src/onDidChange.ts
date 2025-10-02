import { Uri, workspace } from "vscode";
import { onDidChangeDoc } from "./onDidChangeDoc";

/**
 * Handles a file change by opening the corresponding `TextDocument` and
 * updating the internal document cache.
 *
 * This function is typically triggered by a file system watcher. It uses
 * `workspace.openTextDocument` to load the document at the given URI and
 * delegates to `onDidChangeDoc` to parse and store it in the internal cache.
 *
 * @param uri - The `Uri` of the file that changed.
 *
 * @example
 * ```ts
 * import { onDidChange } from "./onDidChange";
 * import { Uri } from "vscode";
 *
 * const fileUri = Uri.file("/path/to/file.html");
 * onDidChange(fileUri);
 * ```
 */
export const onDidChange = (uri: Uri) =>
  workspace.openTextDocument(uri).then(onDidChangeDoc);
