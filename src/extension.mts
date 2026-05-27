import { workspace, type ExtensionContext } from "vscode";
import { diagnosticCollection } from "./document/data.mts";
import {
  onDidCloseDiagnostics,
  onDidCreateDiagnostics,
  onDidCreateFilesDiagnostics,
  onDidDeleteFilesDiagnostics,
  onDidEditDiagnostics,
  onDidRenameFilesDiagnostics,
} from "./document/documents.mts";
import { configure } from "./runtime/configure.mts";
import { disposeLanguages } from "./runtime/languages.mts";
import { onDidChangeConfiguration } from "./runtime/onDidChangeConfiguration.mts";
import {
  getWatcher,
  updateFileSystemWatcher,
} from "./runtime/updateFileSystemWatcher.mts";

/**
 * Initializes the extension runtime, configures services, and registers VS Code
 * subscriptions.
 */
export const activate = async ({ subscriptions }: ExtensionContext) => {
  await configure();

  subscriptions.push(
    diagnosticCollection,
    workspace.onDidChangeConfiguration(onDidChangeConfiguration),
    workspace.onDidChangeTextDocument(onDidEditDiagnostics),
    workspace.onDidChangeWorkspaceFolders(updateFileSystemWatcher),
    workspace.onDidCloseTextDocument(onDidCloseDiagnostics),
    workspace.onDidCreateFiles(onDidCreateFilesDiagnostics),
    workspace.onDidDeleteFiles(onDidDeleteFilesDiagnostics),
    workspace.onDidOpenTextDocument(onDidCreateDiagnostics),
    workspace.onDidRenameFiles(onDidRenameFilesDiagnostics),
  );
};

/**
 * Cleans up extension resources including watchers and language registrations.
 */
export const deactivate = () => {
  getWatcher()?.dispose();
  disposeLanguages();
};
