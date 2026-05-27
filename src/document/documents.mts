import {
  type TextDocument,
  type TextDocumentChangeEvent,
  type Uri,
  window,
  workspace,
} from "vscode";
import { Document } from "./Document.mts";
import { config, documents } from "./data.mts";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection.mts";

/**
 * Produces a handler that upserts documents in the internal document index.
 */
const setDoc = (overwrite: boolean) => (doc: TextDocument) => {
  const { uri, languageId } = doc;
  const url = uri.toString();

  if (
    documents.has(url) === overwrite &&
    Document.isApplicable(languageId, uri)
  ) {
    documents.set(url, new Document(doc));
  }
};

/**
 * Wraps a function so that diagnostics are updated after execution.
 */
export const withDiagnostics =
  <T extends unknown[], R>(callback: (...args: T) => R) =>
  (...args: T) => {
    const result = callback(...args);
    updateDiagnosticCollection();
    return result;
  };

/**
 * Wraps an async function so that diagnostics are updated after completion.
 */
export const withDiagnosticsAsync =
  <T extends unknown[], R>(callback: (...args: T) => Promise<R>) =>
  async (...args: T) => {
    const result = await callback(...args);
    updateDiagnosticCollection();
    return result;
  };

/**
 * Converts a URI into a loaded text document before executing a callback.
 *
 * Displays an error message if the document cannot be opened.
 */
export const withUri =
  <T extends unknown>(callback: (doc: TextDocument) => T) =>
  async (uri: Uri): Promise<T | void> => {
    try {
      return callback(await workspace.openTextDocument(uri));
    } catch (error) {
      window.showErrorMessage(`Failed to open ${uri.fsPath}. ${error}`);
    }
  };

/**
 * Applies a callback to each file in a file list.
 */
export const withFiles =
  <T, I>(callback: (uri: I) => T) =>
  ({ files }: { files: readonly I[] }) =>
    files.map(callback);

/**
 * Applies an async callback to a list of files.
 */
export const withFilesAsync =
  <T, I>(callback: (uri: I) => Promise<T>) =>
  ({ files }: { files: readonly I[] }) =>
    Promise.all(files.map(callback));

/**
 * Updates internal document state in response to text edits.
 */
export const onDidEdit = (e: TextDocumentChangeEvent): void =>
  documents.get(e.document.uri.toString())?.update(e);

/**
 * Updates document indexing when a file is renamed.
 */
export const onDidRename = ({
  oldUri,
  newUri,
}: {
  oldUri: Uri;
  newUri: Uri;
}) => {
  const oldUrl = oldUri.toString();
  const cur = documents.get(oldUrl);

  if (cur) {
    cur.uri = newUri;
    documents.delete(oldUrl);
    documents.set(newUri.toString(), cur);
  }
};

/**
 * Removes a document from the internal index when it is deleted.
 */
export const onDidDeleteUri = (uri: Uri) => documents.delete(uri.toString());

/**
 * Handles document close events and removes non file-based documents.
 */
export const onDidClose = ({ uri }: TextDocument) =>
  uri.scheme === "file" || onDidDeleteUri(uri);

/**
 * Populates the document index from currently open workspace documents
 * and optionally from files matched by configuration.
 */
export const populateDocs = async () => {
  workspace.textDocuments.forEach(onDidCreate);

  if (config.EXT_GLOB) {
    const files = await workspace.findFiles(config.EXT_GLOB);
    await Promise.all(files.map(onDidCreateUri));
  }
};

/**
 * Removes documents that are no longer applicable or should be excluded
 * from diagnostic processing.
 */
export const pruneDocs = (affectsLog?: boolean) => {
  for (const [url, cur] of documents) {
    if (!cur.isApplicable() || (affectsLog && cur.diagnostics.hasLog)) {
      documents.delete(url);
    }
  }
};

export const onDidCreate = setDoc(false);

export const onDidChange = setDoc(true);

const onDidCreateUri = withUri(onDidCreate);

const onDidChangeUri = withUri(onDidChange);

const onDidCreateFiles = withFilesAsync(onDidCreateUri);

const onDidDeleteFiles = withFiles(onDidDeleteUri);

const onDidRenameFiles = withFiles(onDidRename);

export const onDidChangeUriDiagnostics = withDiagnosticsAsync(onDidChangeUri);

export const onDidCreateUriDiagnostics = withDiagnosticsAsync(onDidCreateUri);

export const onDidDeleteUriDiagnostics = withDiagnostics(onDidDeleteUri);

export const onDidCreateFilesDiagnostics =
  withDiagnosticsAsync(onDidCreateFiles);

export const onDidDeleteFilesDiagnostics = withDiagnostics(onDidDeleteFiles);

export const onDidCreateDiagnostics = withDiagnostics(onDidCreate);

export const onDidRenameFilesDiagnostics = withDiagnostics(onDidRenameFiles);

export const onDidCloseDiagnostics = withDiagnostics(onDidClose);

export const onDidEditDiagnostics = withDiagnostics(onDidEdit);
