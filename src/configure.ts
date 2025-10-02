import {
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  extensions,
  FileSystemWatcher,
  languages,
  workspace,
} from "vscode";
import { match } from "./match";
import { onDidChange } from "./onDidChange";
import { onDidCreate } from "./onDidCreate";
import { onDidCreateDoc } from "./onDidCreateDoc";
import { onDidDelete } from "./onDidDelete";
import { registerProviders } from "./registerProviders";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection";

const severityMap = new Map([
  ["Error", DiagnosticSeverity.Error],
  ["Warning", DiagnosticSeverity.Warning],
  ["Information", DiagnosticSeverity.Information],
  ["Hint", DiagnosticSeverity.Hint],
]);

let exclude: string[];
let include: string[];
let fileExtensions: string[];
let fileExtensionGlob: string | null;
let attrs: Record<string, string | null>;
let languageIds: string[];
let actionUndefinedSeverity: DiagnosticSeverity | undefined;
let actionUnusedSeverity: DiagnosticSeverity | undefined;
let diagnosticCollection: DiagnosticCollection;
let watcher: FileSystemWatcher;

export const docs = new Map<string, ParsedDocument>();
export const languageDisposables = new Map<string, Disposable[]>();

/**
 * Returns the attributes object of a Node that is currently being processed.
 *
 * These are the attributes that the extension considers when providing
 * diagnostics, completions, and hover information.
 *
 * @returns The current record of attribute names mapped to their string or null
 *          values.
 *
 * @example
 * ```ts
 * const attrs = getAttributes();
 * console.log(attrs["on:click"]); // might output null or a value if defined
 * ```
 */
export const getAttributes = () => attrs;

/**
 * Sets the attributes object of a Node that is currently being processed.
 *
 * @param attributes - A record mapping attribute names to their values.
 *
 * @example
 * ```ts
 * setAttributes({ "on:click": null, "if:loading": "boolean" });
 * ```
 */
export const setAttributes = (attributes: typeof attrs | null | undefined) =>
  (attrs = attributes ?? {});

/**
 * Returns the list of language IDs that should be processed.
 *
 * These IDs determine which files are analyzed for diagnostics, hovers,
 * and completions.
 *
 * @returns An array of VS Code language IDs.
 *
 * @example
 * ```ts
 * const langs = getLanguageIds();
 * console.log(langs); // ["html", "vue", "svelte"]
 * ```
 */
export const getLanguageIds = () => languageIds;

/**
 * Returns the configured severity level for actions that are **undefined**.
 *
 * The severity is used when generating diagnostics if an element references
 * an action that is not defined anywhere in the document.
 *
 * @returns A {@link DiagnosticSeverity} value or `undefined` if not set.
 *
 * @example
 * ```ts
 * const severity = getActionUndefinedSeverity();
 * console.log(severity === vscode.DiagnosticSeverity.Error); // true or false
 * ```
 */
export const getActionUndefinedSeverity = () => actionUndefinedSeverity;

/**
 * Returns the configured severity level for actions that are **unused**.
 *
 * The severity is used when generating diagnostics if an action is defined
 * in the document but never referenced.
 *
 * @returns A {@link DiagnosticSeverity} value or `undefined` if not set.
 */
export const getActionUnusedSeverity = () => actionUnusedSeverity;

/**
 * Returns the current list of file patterns that should be **excluded** from
 * processing.
 *
 * These patterns come from VS Code's `search.exclude` configuration combined
 * with extension-specific settings.
 *
 * @returns An array of glob patterns to exclude.
 */
export const getExclude = () => exclude;

/**
 * Returns the current list of file patterns that should be **included** for
 * processing.
 *
 * This is typically configured in the extension settings under `keml.include`.
 *
 * @returns An array of glob patterns to include.
 */
export const getInclude = () => include;

/**
 * Returns the current FileSystemWatcher instance for files.
 *
 * This watcher monitors file changes, creations, and deletions and triggers
 * appropriate update functions in the extension.
 *
 * @returns A {@link FileSystemWatcher} instance.
 */
export const getWatcher = () => watcher;

/**
 * Returns the VS Code DiagnosticCollection.
 *
 * If the collection does not yet exist, it will be created.
 * This collection is used to store and display diagnostics for all documents in
 * the workspace.
 *
 * @returns A {@link DiagnosticCollection} instance.
 */
export const getDiagnosticCollection = () =>
  diagnosticCollection ??
  (diagnosticCollection = languages.createDiagnosticCollection("KEML"));

/**
 * Updates the file system watcher.
 *
 * Disposes of any previous watcher and creates a new one if file extension
 * patterns are configured. Registers handlers for file change, creation,
 * and deletion events.
 *
 * @remarks
 * Must be called whenever the file extensions or include/exclude patterns
 * change, to ensure the watcher tracks the correct files.
 */
export const updateFileSystemWatcher = () => {
  if (watcher) {
    watcher.dispose();
  }
  if (fileExtensionGlob) {
    watcher = workspace.createFileSystemWatcher(fileExtensionGlob);
    watcher.onDidChange(onDidChange);
    watcher.onDidCreate(onDidCreate);
    watcher.onDidDelete(onDidDelete);
  }
};

/**
 * Configures the environment in the current workspace.
 *
 * Reads workspace and extension settings to determine:
 * - Which files to include/exclude
 * - Language IDs to process
 * - Diagnostic severities for undefined/unused actions
 * - Which language providers to register
 *
 * Initializes the in-memory document map (`docs`) and sets up the
 * file system watcher to track KEML-relevant files.
 *
 * @remarks
 * This function should be called during extension activation and whenever
 * configuration changes are detected.
 *
 * @example
 * ```ts
 * await configure();
 * ```
 */
export const configure = async () => {
  const excludes = workspace
    .getConfiguration("search")
    .get<Record<string, boolean>>("exclude", {});
  const keml = workspace.getConfiguration("keml");
  let languages: { id: string; extensions?: string[] }[] | undefined;
  let packageJSON, id, exts, ext, disposable, languageId, disposables;

  exclude = [];
  include = keml.get<string[]>("include", []);
  languageIds = keml.get<string[]>("languageIds", ["html"]);
  actionUndefinedSeverity = severityMap.get(
    keml.get<string>("actionUndefinedSeverity", "Error")
  );
  actionUnusedSeverity = severityMap.get(
    keml.get<string>("actionUnusedSeverity", "Error")
  );
  fileExtensions = [];

  for (const pattern in excludes) {
    if (excludes[pattern]) {
      exclude.push(pattern);
    }
  }

  for ({ packageJSON } of extensions.all) {
    if ((languages = packageJSON?.contributes?.languages)) {
      for ({ id, extensions: exts } of languages) {
        if (exts && languageIds.includes(id)) {
          for (ext of exts) {
            if (ext.charCodeAt(0) === 46) {
              ext = ext.slice(1);
            }
            fileExtensions.push(ext);
          }
        }
      }
    }
  }

  fileExtensionGlob = fileExtensions.length
    ? `**/*.{${fileExtensions.join(",")}}`
    : null;

  for (const [url, cur] of docs) {
    if (
      !languageIds.includes(cur.doc.languageId) ||
      !match(cur.doc.uri.path, exclude, include)
    ) {
      docs.delete(url);
    }
  }

  for ([languageId, disposables] of Array.from(languageDisposables)) {
    if (!languageIds.includes(languageId)) {
      for (disposable of disposables) {
        disposable.dispose();
      }
      languageDisposables.delete(languageId);
    }
  }

  workspace.textDocuments.forEach(onDidCreateDoc);

  if (fileExtensionGlob) {
    const files = await workspace.findFiles(fileExtensionGlob);
    await Promise.all(files.map(onDidCreate));
  }

  updateDiagnosticCollection();
  updateFileSystemWatcher();

  for (languageId of languageIds) {
    if (!languageDisposables.has(languageId)) {
      languageDisposables.set(languageId, registerProviders(languageId));
    }
  }
};
