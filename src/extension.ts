import { ExtensionContext, workspace } from "vscode";
import {
  configure,
  getDiagnosticCollection,
  getWatcher,
  languageDisposables,
  updateFileSystemWatcher,
} from "./configure";
import { onDidChangeConfiguration } from "./onDidChangeConfiguration";
import { onDidChangeTextDocument } from "./onDidChangeTextDocument";
import { onDidCreateDoc } from "./onDidCreateDoc";
import { onDidCreateFiles } from "./onDidCreateFiles";
import { onDidDeleteFiles } from "./onDidDeleteFiles";
import { onDidRenameFiles } from "./onDidRenameFiles";

/**
 * Activates the extension, setting up configuration, diagnostics, and file
 * watchers.
 *
 * This function performs the following steps:
 * 1. Configures the extension based on workspace settings.
 * 2. Registers the diagnostic collection to track issues.
 * 3. Subscribes to workspace and document events.
 *
 * @param context - The VS Code extension context, used to manage disposables.
 */
export const activate = async ({ subscriptions }: ExtensionContext) => {
  await configure();

  subscriptions.push(
    getDiagnosticCollection(),
    workspace.onDidChangeConfiguration(onDidChangeConfiguration),
    workspace.onDidChangeTextDocument(onDidChangeTextDocument),
    workspace.onDidChangeWorkspaceFolders(updateFileSystemWatcher),
    workspace.onDidCreateFiles(onDidCreateFiles),
    workspace.onDidDeleteFiles(onDidDeleteFiles),
    workspace.onDidOpenTextDocument(onDidCreateDoc),
    workspace.onDidRenameFiles(onDidRenameFiles)
  );
};

/**
 * Deactivates the extension, cleaning up all disposables and watchers.
 *
 * This function performs the following cleanup:
 * 1. Disposes of the file system watcher.
 * 2. Disposes of all registered language feature providers.
 * 3. Clears the internal map of language disposables.
 *
 * This ensures that no resources are leaked when the extension is deactivated.
 */
export const deactivate = () => {
  getWatcher().dispose();

  let disposable;
  for (const disposables of languageDisposables.values()) {
    for (disposable of disposables) {
      disposable.dispose();
    }
  }
  languageDisposables.clear();
};
