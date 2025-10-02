import { FileCreateEvent } from "vscode";
import { onDidCreate } from "./onDidCreate";

/**
 * Handles a batch of newly created files by invoking `onDidCreate` for each
 * file.
 *
 * This function is intended to be used as a listener for file creation events
 * in the workspace, ensuring that all new files are opened, parsed, and added
 * to the in-memory document cache.
 *
 * @param e - A `FileCreateEvent` containing the list of newly created files.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidCreateFiles } from "./onDidCreateFiles";
 *
 * workspace.onDidCreateFiles(onDidCreateFiles);
 * ```
 */
export const onDidCreateFiles = ({ files }: FileCreateEvent) =>
  files.forEach(onDidCreate);
