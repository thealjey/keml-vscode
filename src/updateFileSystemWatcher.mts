import { FileSystemWatcher, workspace } from "vscode";
import { getFileExtensionGlob } from "./data.mts";
import {
  onDidChangeUriDiagnostics,
  onDidCreateUriDiagnostics,
  onDidDeleteUriDiagnostics,
} from "./documents.mts";

let watcher: FileSystemWatcher;

/**
 * Retrieves the file system watcher instance.
 *
 * @returns The watcher used to monitor file changes.
 */
export const getWatcher = () => watcher;

/**
 * Updates the file system watcher for the workspace.
 *
 * Disposes the previous watcher if it exists, then creates a new watcher for
 * the configured file extensions and sets up event handlers.
 */
export const updateFileSystemWatcher = () => {
  if (watcher) {
    watcher.dispose();
  }
  const fileExtensionGlob = extern.getFileExtensionGlob();
  if (fileExtensionGlob) {
    watcher = extern.workspace.createFileSystemWatcher(fileExtensionGlob);
    watcher.onDidChange(onDidChangeUriDiagnostics);
    watcher.onDidCreate(onDidCreateUriDiagnostics);
    watcher.onDidDelete(onDidDeleteUriDiagnostics);
  }
};

let extern = { workspace, getFileExtensionGlob };

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

  describe("FileSystemWatcher Module", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("getWatcher returns the current watcher", () => {
      const fakeWatcher = {} as any;
      (watcher as any) = fakeWatcher;
      expect(getWatcher()).toBe(fakeWatcher);
    });

    it("updateFileSystemWatcher disposes existing watcher and sets up new watcher if glob exists", () => {
      const disposeFn = fn();
      const onDidChange = fn();
      const onDidCreate = fn();
      const onDidDelete = fn();

      const oldWatcher = { dispose: disposeFn } as any;
      (watcher as any) = oldWatcher;

      const newWatcher = {
        onDidChange,
        onDidCreate,
        onDidDelete,
      };

      extern.getFileExtensionGlob = fn(() => "*.keml");
      extern.workspace = {
        createFileSystemWatcher: fn(() => newWatcher),
      } as any;

      updateFileSystemWatcher();

      // old watcher disposed
      expect(disposeFn).toHaveBeenCalled();

      // new watcher created with correct glob
      expect(extern.workspace.createFileSystemWatcher).toHaveBeenCalledWith(
        "*.keml"
      );

      // callbacks attached
      expect(newWatcher.onDidChange).toHaveBeenCalledWith(
        onDidChangeUriDiagnostics
      );
      expect(newWatcher.onDidCreate).toHaveBeenCalledWith(
        onDidCreateUriDiagnostics
      );
      expect(newWatcher.onDidDelete).toHaveBeenCalledWith(
        onDidDeleteUriDiagnostics
      );

      // watcher variable updated
      expect(getWatcher()).toBe(newWatcher);
    });

    it("updateFileSystemWatcher does nothing if getFileExtensionGlob returns falsy", () => {
      (watcher as any) = undefined;

      extern.getFileExtensionGlob = fn(() => "");
      extern.workspace = { createFileSystemWatcher: fn() } as any;

      updateFileSystemWatcher();

      expect(extern.workspace.createFileSystemWatcher).not.toHaveBeenCalled();
    });
  });
}
/* v8 ignore stop */
