import { FileSystemWatcher, workspace } from "vscode";
import { config } from "../document/data.mts";
import {
  onDidChangeUriDiagnostics,
  onDidCreateUriDiagnostics,
  onDidDeleteUriDiagnostics,
} from "../document/documents.mts";

let watcher: FileSystemWatcher | undefined;

/**
 * Retrieves the file system watcher instance.
 *
 * @returns The watcher used to monitor file changes.
 */
export const getWatcher = () => watcher;

/**
 * Updates the file system watcher for the workspace.
 *
 * Disposes the previous watcher if it exists, then creates a new watcher for
 * the configured file extensions and sets up event handlers.
 */
export const updateFileSystemWatcher = () => {
  watcher?.dispose();

  if (config.EXT_GLOB) {
    watcher = workspace.createFileSystemWatcher(config.EXT_GLOB);
    watcher.onDidChange(onDidChangeUriDiagnostics);
    watcher.onDidCreate(onDidCreateUriDiagnostics);
    watcher.onDidDelete(onDidDeleteUriDiagnostics);
  }
};
