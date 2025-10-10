import { languages } from "vscode";
import { completionProvider } from "./completionProvider.mts";
import { hoverProvider } from "./hoverProvider.mts";
import { definitionProvider, referenceProvider } from "./referenceProvider.mts";

/**
 * Registers language service providers for a specific language.
 *
 * @param languageId Identifier of the language to register providers for.
 * @returns Array of disposable provider registrations.
 */
export const registerProviders = (languageId: string) => [
  extern.languages.registerCompletionItemProvider(
    languageId,
    completionProvider,
    " "
  ),
  extern.languages.registerDefinitionProvider(languageId, definitionProvider),
  extern.languages.registerReferenceProvider(languageId, referenceProvider),
  extern.languages.registerHoverProvider(languageId, hoverProvider),
];

let extern = { languages };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    vi: { fn },
    afterAll,
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("registerProviders", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("registers all providers correctly and returns the results", () => {
      const registerCompletionItemProvider = fn(() => "completion");
      const registerDefinitionProvider = fn(() => "definition");
      const registerReferenceProvider = fn(() => "reference");
      const registerHoverProvider = fn(() => "hover");

      extern.languages = {
        registerCompletionItemProvider,
        registerDefinitionProvider,
        registerReferenceProvider,
        registerHoverProvider,
      } as any;

      const result = registerProviders("keml");

      expect(result).toEqual([
        "completion",
        "definition",
        "reference",
        "hover",
      ]);

      expect(registerCompletionItemProvider).toHaveBeenCalledWith(
        "keml",
        completionProvider,
        " "
      );
      expect(registerDefinitionProvider).toHaveBeenCalledWith(
        "keml",
        definitionProvider
      );
      expect(registerReferenceProvider).toHaveBeenCalledWith(
        "keml",
        referenceProvider
      );
      expect(registerHoverProvider).toHaveBeenCalledWith("keml", hoverProvider);
    });
  });
}
/* v8 ignore stop */
