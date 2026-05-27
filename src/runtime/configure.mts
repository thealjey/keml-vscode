import { DiagnosticSeverity, workspace } from "vscode";
import { config, setGlobs, setLanguageIds } from "../document/data.mts";
import { populateDocs, pruneDocs } from "../document/documents.mts";
import { updateDiagnosticCollection } from "../document/updateDiagnosticCollection.mts";
import { get } from "../util/get.mts";
import { getAllLanguageExtensions } from "./getAllLanguageExtensions.mts";
import { populateLanguages, pruneLanguages } from "./languages.mts";
import { updateFileSystemWatcher } from "./updateFileSystemWatcher.mts";

const severityMap = new Map([
  ["Error", DiagnosticSeverity.Error],
  ["Warning", DiagnosticSeverity.Warning],
  ["Information", DiagnosticSeverity.Information],
  ["Hint", DiagnosticSeverity.Hint],
]);

/**
 * Applies updated configuration to all extension subsystems.
 *
 * Rebuilds internal state for language support, document analysis,
 * diagnostics, and file system observation.
 */
export const configure = async (affectsLog?: boolean) => {
  const exclude = Object.entries(
    workspace
      .getConfiguration("search", null)
      .get<Record<string, boolean>>("exclude", {}),
  )
    .filter(get, 1)
    .map<string, 0>(get, 0);

  const keml = workspace.getConfiguration("keml", null);
  const include = keml.get<string[]>("include", []);
  const languageIds = new Set(keml.get<string[]>("languageIds", ["html"]));
  const fileExts = Array.from(languageIds).flatMap(getAllLanguageExtensions);
  const UNRESOLVED = severityMap.get(
    keml.get<string>("actionUndefinedSeverity", "Error"),
  );
  const UNUSED = severityMap.get(
    keml.get<string>("actionUnusedSeverity", "Warning"),
  );
  const WARN_LOG = keml.get<boolean>("warnOnLogAttribute", true);

  setGlobs(exclude, include);
  setLanguageIds(languageIds);

  config.UNRESOLVED = UNRESOLVED;
  config.UNUSED = UNUSED;
  config.WARN_LOG = WARN_LOG;
  config.EXT_GLOB = fileExts.length ? `**/*.{${fileExts.join(",")}}` : null;

  pruneDocs(affectsLog);
  pruneLanguages();
  await populateDocs();
  updateDiagnosticCollection();
  updateFileSystemWatcher();
  populateLanguages();
};
