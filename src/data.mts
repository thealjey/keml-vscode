/**
 * A data file is strictly prohibited from importing any local project files.
 * Must store global application data, but not perform any computation on it.
 */

import {
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  languages,
} from "vscode";

export const docs = new Map<string, Document>();
export const languageDisposables = new Map<string, Disposable[]>();

const severityMap = new Map([
  ["Error", DiagnosticSeverity.Error],
  ["Warning", DiagnosticSeverity.Warning],
  ["Information", DiagnosticSeverity.Information],
  ["Hint", DiagnosticSeverity.Hint],
]);

let diagnosticCollection: DiagnosticCollection;
let attrs: Map<string, Attr | null>;
let excludes: string[];
let includes: string[];
let fileExts: string[];
let fileExtGlob: string | null;
let langIds: string[];
let undefinedSeverity: DiagnosticSeverity | undefined;
let unusedSeverity: DiagnosticSeverity | undefined;

/**
 * Retrieves the shared diagnostic collection.
 *
 * @returns The diagnostic collection instance.
 */
export const getDiagnosticCollection = () =>
  diagnosticCollection ??
  (diagnosticCollection = extern.languages.createDiagnosticCollection("KEML"));

/**
 * Retrieves the parsed attributes for the node currently being processed.
 *
 * @returns A map of attributes.
 */
export const getAttributes = () => attrs;

/**
 * Sets the parsed attributes for the node currently being processed.
 *
 * @param attributes - A map of attributes to set.
 */
export const setAttributes = (attributes: typeof attrs) => (attrs = attributes);

/**
 * Retrieves the current exclusion patterns.
 *
 * @returns The list of exclusion patterns.
 */
export const getExclude = () => excludes;

/**
 * Sets the exclusion patterns.
 *
 * @param exclude - The list of exclusion patterns to set.
 */
export const setExclude = (exclude: typeof excludes) => (excludes = exclude);

/**
 * Retrieves the current inclusion patterns.
 *
 * @returns The list of inclusion patterns.
 */
export const getInclude = () => includes;

/**
 * Sets the inclusion patterns.
 *
 * @param include - The list of inclusion patterns to set.
 */
export const setInclude = (include: typeof includes) => (includes = include);

/**
 * Retrieves the currently configured file extensions.
 *
 * @returns The list of file extensions.
 */
export const getFileExtensions = () => fileExts;

/**
 * Sets the file extensions to be used.
 *
 * @param fileExtensions - The list of file extensions to set.
 */
export const setFileExtensions = (fileExtensions: typeof fileExts) => (
  (fileExts = fileExtensions),
  (fileExtGlob = fileExtensions.length
    ? `**/*.{${fileExtensions.join(",")}}`
    : null)
);

/**
 * Retrieves the glob pattern for the currently configured file extensions.
 *
 * @returns The file extension glob pattern, or null if none is set.
 */
export const getFileExtensionGlob = () => fileExtGlob;

/**
 * Retrieves the currently configured language IDs.
 *
 * @returns The list of language IDs.
 */
export const getLanguageIds = () => langIds;

/**
 * Sets the language IDs to be used.
 *
 * @param languageIds - The list of language IDs to set.
 */
export const setLanguageIds = (languageIds: typeof langIds) =>
  (langIds = languageIds);

/**
 * Retrieves the current severity level for undefined actions.
 *
 * @returns The severity level, or undefined if not set.
 */
export const getActionUndefinedSeverity = () => undefinedSeverity;

/**
 * Sets the severity level for undefined actions.
 *
 * @param actionUndefinedSeverity - The severity level to set.
 */
export const setActionUndefinedSeverity = (actionUndefinedSeverity: string) =>
  (undefinedSeverity = severityMap.get(actionUndefinedSeverity));

/**
 * Retrieves the current severity level for unused actions.
 *
 * @returns The severity level, or undefined if not set.
 */
export const getActionUnusedSeverity = () => unusedSeverity;

/**
 * Sets the severity level for unused actions.
 *
 * @param actionUnusedSeverity - The severity level to set.
 */
export const setActionUnusedSeverity = (actionUnusedSeverity: string) =>
  (unusedSeverity = severityMap.get(actionUnusedSeverity));

let extern = { languages };

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect, afterAll } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("data", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("getDiagnosticCollection", () => {
      extern.languages = {
        createDiagnosticCollection: () => "collection" as any,
      } as any;
      expect(getDiagnosticCollection()).toBe(getDiagnosticCollection());
    });

    it("attributes", () => {
      expect(setAttributes(new Map())).toBe(getAttributes());
    });

    it("exclude", () => {
      expect(setExclude([])).toBe(getExclude());
    });

    it("include", () => {
      expect(setInclude([])).toBe(getInclude());
    });

    it("fileExtensions", () => {
      let fileExtensions: string[] = [];
      let fileExtensionGlob = setFileExtensions(fileExtensions);
      expect(fileExtensionGlob).toBe(null);
      expect(getFileExtensionGlob()).toBe(null);
      expect(getFileExtensions()).toBe(fileExtensions);
      fileExtensions = ["foo", "bar"];
      fileExtensionGlob = setFileExtensions(fileExtensions);
      expect(fileExtensionGlob).toBe("**/*.{foo,bar}");
      expect(getFileExtensionGlob()).toBe("**/*.{foo,bar}");
      expect(getFileExtensions()).toBe(fileExtensions);
    });

    it("languageIds", () => {
      expect(setLanguageIds([])).toBe(getLanguageIds());
    });

    it("actionUndefinedSeverity", () => {
      const actionUndefinedSeverity = setActionUndefinedSeverity("Information");
      expect(actionUndefinedSeverity).toBe(DiagnosticSeverity.Information);
      expect(getActionUndefinedSeverity()).toBe(DiagnosticSeverity.Information);
    });

    it("actionUnusedSeverity", () => {
      const actionUnusedSeverity = setActionUnusedSeverity("Hint");
      expect(actionUnusedSeverity).toBe(DiagnosticSeverity.Hint);
      expect(getActionUnusedSeverity()).toBe(DiagnosticSeverity.Hint);
    });
  });
}
/* v8 ignore stop */
