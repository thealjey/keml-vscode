import { FileDeleteEvent } from "vscode";
import { onDidDelete } from "./onDidDelete";

/**
 * Handles multiple file deletions by invoking {@link onDidDelete} for each
 * file.
 *
 * This ensures that all deleted files are removed from the in-memory document
 * cache and the diagnostic collection is updated accordingly.
 *
 * @param e - The `FileDeleteEvent` containing an array of `Uri` objects
 *            representing the deleted files.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidDeleteFiles } from "./onDidDeleteFiles";
 *
 * workspace.onDidDeleteFiles(onDidDeleteFiles);
 * ```
 */
export const onDidDeleteFiles = ({ files }: FileDeleteEvent) =>
  files.forEach(onDidDelete);
