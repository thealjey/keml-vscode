import { matchesGlob } from "node:path";
import { languages, type DiagnosticSeverity, type Uri } from "vscode";

function glob(this: string, pattern: string) {
  return (
    matchesGlob(this, pattern) ||
    matchesGlob(this, `**/${pattern}`) ||
    matchesGlob(this, `${pattern}/**`) ||
    matchesGlob(this, `**/${pattern}/**`)
  );
}

let languageIds: Set<string>;
let matcher: (value: string) => boolean;

export const config = {} as {
  UNRESOLVED: DiagnosticSeverity | undefined;
  UNUSED: DiagnosticSeverity | undefined;
  WARN_LOG: boolean;
  EXT_GLOB: string | null;
};

export const documents = new Map<string, Document>();

export const diagnosticCollection =
  languages.createDiagnosticCollection("KEML");

/**
 * Defines the set of supported language IDs for indexing.
 */
export const setLanguageIds = (value: Set<string>) => (languageIds = value);

/**
 * Retrieves the currently configured set of supported language IDs.
 */
export const getLanguageIds = () => languageIds;

/**
 * Configures file inclusion and exclusion rules for workspace matching.
 */
export const setGlobs = (exclude: string[], include: string[]) =>
  (matcher = (value: string) =>
    !exclude.some(glob, value) || include.some(glob, value));

/**
 * Checks whether a language ID is supported by the current configuration.
 */
export const matchLanguageId = (languageId: string) =>
  languageIds.has(languageId);

/**
 * Determines whether a file URI matches the configured include/exclude rules.
 */
export const matchUri = ({ path }: Uri) => matcher(path);
