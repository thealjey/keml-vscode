import { FileRenameEvent } from "vscode";
import { onDidRename } from "./onDidRename";

/**
 * Handles multiple file rename events by delegating each rename to the
 * `onDidRename` handler.
 *
 * Iterates over all renamed files in the event and updates the in-memory
 * document cache and diagnostics for each file.
 *
 * @param e - The `FileRenameEvent` containing the list of renamed files.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidRenameFiles } from "./onDidRenameFiles";
 *
 * workspace.onDidRenameFiles(onDidRenameFiles);
 * ```
 */
export const onDidRenameFiles = ({ files }: FileRenameEvent) =>
  files.forEach(onDidRename);
