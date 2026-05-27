import { languages, type Disposable } from "vscode";
import { getLanguageIds, matchLanguageId } from "../document/data.mts";
import { completionProvider } from "./completionProvider.mts";
import { definitionProvider } from "./definitionProvider.mts";
import { documentHighlightProvider } from "./documentHighlightProvider.mts";
import { documentSymbolProvider } from "./documentSymbolProvider.mts";
import { hoverProvider } from "./hoverProvider.mts";
import { referenceProvider } from "./referenceProvider.mts";
import { renameProvider } from "./renameProvider.mts";
import { workspaceSymbolProvider } from "./workspaceSymbolProvider.mts";

export const languageDisposables = new Map<string, Disposable[]>();

/**
 * Registers language feature providers for all supported language IDs.
 *
 * Enables editor features such as completion, navigation, hover, references,
 * and renaming for each supported language.
 */
export const populateLanguages = () => {
  for (const languageId of getLanguageIds()) {
    languageDisposables.has(languageId) ||
      languageDisposables.set(languageId, [
        languages.registerCompletionItemProvider(
          languageId,
          completionProvider,
          " ",
          ":",
          "-",
        ),
        languages.registerDocumentHighlightProvider(
          languageId,
          documentHighlightProvider,
        ),
        languages.registerDocumentSymbolProvider(
          languageId,
          documentSymbolProvider,
        ),
        languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider),
        languages.registerDefinitionProvider(languageId, definitionProvider),
        languages.registerReferenceProvider(languageId, referenceProvider),
        languages.registerRenameProvider(languageId, renameProvider),
        languages.registerHoverProvider(languageId, hoverProvider),
      ]);
  }
};

/**
 * Disables language feature providers for unsupported language IDs.
 *
 * Removes previously registered providers when a language is no longer matched.
 */
export const pruneLanguages = () => {
  for (const [languageId, disposables] of languageDisposables) {
    if (!matchLanguageId(languageId)) {
      for (const disposable of disposables) {
        disposable.dispose();
      }
      languageDisposables.delete(languageId);
    }
  }
};

/**
 * Disposes all registered language feature providers.
 *
 * Fully deactivates language-specific functionality and clears internal
 * registrations.
 */
export const disposeLanguages = () => {
  for (const disposables of languageDisposables.values()) {
    for (const disposable of disposables) {
      disposable.dispose();
    }
  }
  languageDisposables.clear();
};
