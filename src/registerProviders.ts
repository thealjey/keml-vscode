import { languages } from "vscode";
import { completionProvider } from "./completionProvider";
import { hoverProvider } from "./hoverProvider";
import { definitionProvider, referenceProvider } from "./referenceProvider";

/**
 * Registers all core language feature providers for a given language ID.
 *
 * This utility sets up the following providers:
 * - Completion provider for suggesting attributes and their values.
 * - Definition provider for navigating to the definition of event, state, or
 *   result actions.
 * - Reference provider for finding all references.
 * - Hover provider for displaying documentation and descriptions on hover.
 *
 * Each provider is registered with the VS Code `languages` API and is associated
 * with the specified language.
 *
 * @param languageId - The language identifier to register providers for.
 *
 * @returns An array of `Disposable` objects corresponding to each registered
 *          provider.
 *
 * @example
 * ```ts
 * const disposables = registerProviders("html");
 * disposables.forEach(d => context.subscriptions.push(d));
 * ```
 */
export const registerProviders = (languageId: string) => [
  languages.registerCompletionItemProvider(languageId, completionProvider, " "),
  languages.registerDefinitionProvider(languageId, definitionProvider),
  languages.registerReferenceProvider(languageId, referenceProvider),
  languages.registerHoverProvider(languageId, hoverProvider),
];
