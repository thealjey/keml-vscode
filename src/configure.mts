import { extensions, workspace } from "vscode";
import {
  languageDisposables,
  setActionUndefinedSeverity,
  setActionUnusedSeverity,
  setExclude,
  setFileExtensions,
  setInclude,
  setLanguageIds,
  setWarnOnLogAttribute,
} from "./data.mts";
import { populateDocs, pruneDocs } from "./documents.mts";
import { registerProviders } from "./registerProviders.mts";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection.mts";
import { updateFileSystemWatcher } from "./updateFileSystemWatcher.mts";

/**
 * Configures the workspace and language settings, including file extensions,
 * include/exclude patterns, severities, and diagnostic collections.
 *
 * Updates internal configuration and registers necessary providers.
 *
 * @param affectsWarnOnLogAttribute - When `true`, indicates that the
 *   configuration change may affect the display of `log` attribute warnings.
 *   This can trigger a selective refresh of documents containing `log`
 *   attributes to ensure diagnostics reflect the current setting.
 */
export const configure = async (affectsWarnOnLogAttribute: boolean) => {
  const excludes = extern.workspace
    .getConfiguration("search", null)
    .get<Record<string, boolean>>("exclude", {});
  const keml = extern.workspace.getConfiguration("keml", null);
  const languageIds = extern.setLanguageIds(
    keml.get<string[]>("languageIds", ["html"]),
  );
  const exclude = extern.setExclude([]);
  const fileExtensions: string[] = [];
  let languages: { id: string; extensions?: string[] }[] | undefined;
  let packageJSON, id, exts, ext, disposable, languageId, disposables;

  extern.setInclude(keml.get<string[]>("include", []));
  extern.setActionUndefinedSeverity(
    keml.get<string>("actionUndefinedSeverity", "Error"),
  );
  extern.setActionUnusedSeverity(
    keml.get<string>("actionUnusedSeverity", "Warning"),
  );
  extern.setWarnOnLogAttribute(keml.get<boolean>("warnOnLogAttribute", true));

  for (const pattern in excludes) {
    if (excludes[pattern]) {
      exclude.push(pattern);
    }
  }

  for ({ packageJSON } of extern.extensions.all) {
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

  extern.setFileExtensions(fileExtensions);
  extern.pruneDocs(affectsWarnOnLogAttribute);

  for ([languageId, disposables] of Array.from(extern.languageDisposables)) {
    if (!languageIds.includes(languageId)) {
      for (disposable of disposables) {
        disposable.dispose();
      }
      extern.languageDisposables.delete(languageId);
    }
  }

  await extern.populateDocs();
  extern.updateDiagnosticCollection();
  extern.updateFileSystemWatcher();

  for (languageId of languageIds) {
    if (!extern.languageDisposables.has(languageId)) {
      extern.languageDisposables.set(
        languageId,
        extern.registerProviders(languageId),
      );
    }
  }
};

let extern = {
  extensions,
  workspace,
  languageDisposables,
  setActionUndefinedSeverity,
  setActionUnusedSeverity,
  setExclude,
  setFileExtensions,
  setWarnOnLogAttribute,
  setInclude,
  setLanguageIds,
  populateDocs,
  pruneDocs,
  registerProviders,
  updateDiagnosticCollection,
  updateFileSystemWatcher,
};

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("configure", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("configures everything correctly", async () => {
      const excludeMock: string[] = [];
      const languageDisposablesMock = new Map<string, any[]>();
      const registerProvidersMock = fn().mockReturnValue(["disp1", "disp2"]);

      extern.workspace = {
        getConfiguration: fn().mockImplementation(section => ({
          get: (key: string, defaultValue: any) => {
            if (section === "search" && key === "exclude")
              return { "**/node_modules": true, foo: false };
            if (section === "keml" && key === "languageIds")
              return ["html", "js"];
            if (section === "keml" && key === "include") return ["src"];
            if (section === "keml" && key === "actionUndefinedSeverity")
              return "Error";
            if (section === "keml" && key === "actionUnusedSeverity")
              return "Warning";
            if (section === "keml" && key === "warnOnLogAttribute") return 42;
            return defaultValue;
          },
        })),
      } as any;

      extern.extensions = {
        all: [
          {
            packageJSON: {
              contributes: {
                languages: [
                  { id: "html", extensions: [".html", ".htm", "xhtml"] },
                  { id: "js", extensions: [".js"] },
                  { id: "ts", extensions: [".ts"] },
                ],
              },
            },
          },
          {},
        ],
      } as any;

      extern.setLanguageIds = fn().mockImplementation(ids => ids);
      extern.setExclude = fn().mockReturnValue(excludeMock);
      extern.setInclude = fn();
      extern.setActionUndefinedSeverity = fn();
      extern.setActionUnusedSeverity = fn();
      extern.setFileExtensions = fn();
      extern.setWarnOnLogAttribute = fn();
      extern.pruneDocs = fn();
      extern.populateDocs = fn();
      extern.updateDiagnosticCollection = fn();
      extern.updateFileSystemWatcher = fn();
      extern.registerProviders = registerProvidersMock;
      extern.languageDisposables = languageDisposablesMock;

      await configure(false);

      // Excludes populated correctly
      expect(excludeMock).toContain("**/node_modules");

      // File extensions include html, htm, js (ts skipped because languageIds = html, js)
      expect(extern.setFileExtensions).toHaveBeenCalledWith([
        "html",
        "htm",
        "xhtml",
        "js",
      ]);

      // Severities and includes set
      expect(extern.setInclude).toHaveBeenCalledWith(["src"]);
      expect(extern.setActionUndefinedSeverity).toHaveBeenCalledWith("Error");
      expect(extern.setActionUnusedSeverity).toHaveBeenCalledWith("Warning");

      // Docs updated
      expect(extern.pruneDocs).toHaveBeenCalled();
      expect(extern.populateDocs).toHaveBeenCalled();
      expect(extern.updateDiagnosticCollection).toHaveBeenCalled();
      expect(extern.updateFileSystemWatcher).toHaveBeenCalled();
      expect(extern.setWarnOnLogAttribute).toHaveBeenCalledWith(42);

      // Providers registered for languageIds
      expect(registerProvidersMock).toHaveBeenCalledWith("html");
      expect(registerProvidersMock).toHaveBeenCalledWith("js");

      // Disposables map updated
      expect(extern.languageDisposables.has("html")).toBe(true);
      expect(extern.languageDisposables.has("js")).toBe(true);
      expect(extern.languageDisposables.get("html")).toEqual([
        "disp1",
        "disp2",
      ]);
      expect(extern.languageDisposables.get("js")).toEqual(["disp1", "disp2"]);
    });

    it("disposes old languages not in languageIds", async () => {
      const oldDisposeMock = fn();
      const languageDisposablesMock = new Map([
        ["oldLang", [{ dispose: oldDisposeMock }]],
        ["oldLang2", [{ dispose: fn() }]],
      ]);
      extern.languageDisposables = languageDisposablesMock;
      extern.workspace = {
        getConfiguration: fn().mockReturnValue({
          get: fn().mockReturnValue({}),
        }),
      } as any;
      extern.extensions = { all: [] } as any;
      extern.setLanguageIds = fn().mockReturnValue(["oldLang2"]);
      extern.setExclude = fn().mockReturnValue([]);
      extern.setInclude = fn();
      extern.setActionUndefinedSeverity = fn();
      extern.setActionUnusedSeverity = fn();
      extern.setFileExtensions = fn();
      extern.pruneDocs = fn();
      extern.populateDocs = fn();
      extern.updateDiagnosticCollection = fn();
      extern.updateFileSystemWatcher = fn();
      extern.registerProviders = fn();

      await configure(true);

      expect(oldDisposeMock).toHaveBeenCalled();
      expect(extern.languageDisposables.has("oldLang")).toBe(false);
      expect(extern.languageDisposables.has("oldLang2")).toBe(true);
    });
  });
}
/* v8 ignore stop */
