import { ExtensionContext, workspace } from "vscode";
import { configure } from "./configure.mts";
import { getDiagnosticCollection, languageDisposables } from "./data.mts";
import {
  onDidCreateDiagnostics,
  onDidCreateFilesDiagnostics,
  onDidDeleteFilesDiagnostics,
  onDidEdit,
  onDidRenameFilesDiagnostics,
} from "./documents.mts";
import { onDidChangeConfiguration } from "./onDidChangeConfiguration.mts";
import {
  getWatcher,
  updateFileSystemWatcher,
} from "./updateFileSystemWatcher.mts";

/**
 * Activates the extension by performing initial configuration and registering
 * event handlers.
 *
 * @param context - The extension context containing subscriptions.
 */
export const activate = async ({ subscriptions }: ExtensionContext) => {
  await extern.configure();

  subscriptions.push(
    extern.getDiagnosticCollection(),
    extern.workspace.onDidChangeConfiguration(onDidChangeConfiguration),
    extern.workspace.onDidChangeTextDocument(onDidEdit),
    extern.workspace.onDidChangeWorkspaceFolders(updateFileSystemWatcher),
    extern.workspace.onDidCreateFiles(onDidCreateFilesDiagnostics),
    extern.workspace.onDidDeleteFiles(onDidDeleteFilesDiagnostics),
    extern.workspace.onDidOpenTextDocument(onDidCreateDiagnostics),
    extern.workspace.onDidRenameFiles(onDidRenameFilesDiagnostics)
  );
};

/**
 * Deactivates the extension by disposing of watchers and language-specific
 * resources.
 */
export const deactivate = () => {
  extern.getWatcher().dispose();

  let disposable;
  for (const disposables of extern.languageDisposables.values()) {
    for (disposable of disposables) {
      disposable.dispose();
    }
  }
  extern.languageDisposables.clear();
};

let extern = {
  workspace,
  configure,
  getDiagnosticCollection,
  languageDisposables,
  getWatcher,
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

  describe("activate/deactivate", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("activate calls configure and registers workspace listeners with correct handlers and disposables", async () => {
      const configureFn = fn(async () => {});
      const diagCollection = {} as any;

      // Fake disposables returned by workspace registration functions
      const fakeDisposable1 = {};
      const fakeDisposable2 = {};
      const fakeDisposable3 = {};
      const fakeDisposable4 = {};
      const fakeDisposable5 = {};
      const fakeDisposable6 = {};
      const fakeDisposable7 = {};

      const subscriptions: any[] = [];

      extern.configure = configureFn;
      extern.getDiagnosticCollection = fn(() => diagCollection);
      extern.workspace = {
        onDidChangeConfiguration: fn(() => fakeDisposable1),
        onDidChangeTextDocument: fn(() => fakeDisposable2),
        onDidChangeWorkspaceFolders: fn(() => fakeDisposable3),
        onDidCreateFiles: fn(() => fakeDisposable4),
        onDidDeleteFiles: fn(() => fakeDisposable5),
        onDidOpenTextDocument: fn(() => fakeDisposable6),
        onDidRenameFiles: fn(() => fakeDisposable7),
      } as any;

      await activate({ subscriptions } as any);

      expect(configureFn).toHaveBeenCalled();

      // Each workspace function called with the correct module handler
      expect(extern.workspace.onDidChangeConfiguration).toHaveBeenCalledWith(
        onDidChangeConfiguration
      );
      expect(extern.workspace.onDidChangeTextDocument).toHaveBeenCalledWith(
        onDidEdit
      );
      expect(extern.workspace.onDidChangeWorkspaceFolders).toHaveBeenCalledWith(
        updateFileSystemWatcher
      );
      expect(extern.workspace.onDidCreateFiles).toHaveBeenCalledWith(
        onDidCreateFilesDiagnostics
      );
      expect(extern.workspace.onDidDeleteFiles).toHaveBeenCalledWith(
        onDidDeleteFilesDiagnostics
      );
      expect(extern.workspace.onDidOpenTextDocument).toHaveBeenCalledWith(
        onDidCreateDiagnostics
      );
      expect(extern.workspace.onDidRenameFiles).toHaveBeenCalledWith(
        onDidRenameFilesDiagnostics
      );

      // Subscriptions array contains the disposables returned by workspace functions
      expect(subscriptions).toContain(diagCollection);
      expect(subscriptions).toContain(fakeDisposable1);
      expect(subscriptions).toContain(fakeDisposable2);
      expect(subscriptions).toContain(fakeDisposable3);
      expect(subscriptions).toContain(fakeDisposable4);
      expect(subscriptions).toContain(fakeDisposable5);
      expect(subscriptions).toContain(fakeDisposable6);
      expect(subscriptions).toContain(fakeDisposable7);
    });

    it("deactivate disposes watcher and clears language disposables", () => {
      const disposeWatcher = fn();
      const disposable1 = { dispose: fn() };
      const disposable2 = { dispose: fn() };

      extern.getWatcher = fn(() => ({ dispose: disposeWatcher })) as any;
      extern.languageDisposables = new Map([
        ["lang1", [disposable1, disposable2]],
      ]);

      deactivate();

      expect(disposeWatcher).toHaveBeenCalled();
      expect(disposable1.dispose).toHaveBeenCalled();
      expect(disposable2.dispose).toHaveBeenCalled();
      expect(extern.languageDisposables.size).toBe(0);
    });
  });
}
/* v8 ignore stop */
