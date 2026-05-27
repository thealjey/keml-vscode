import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- mocks ----
vi.mock("vscode", () => {
  return {
    workspace: {
      onDidChangeConfiguration: vi.fn(),
      onDidChangeTextDocument: vi.fn(),
      onDidChangeWorkspaceFolders: vi.fn(),
      onDidCloseTextDocument: vi.fn(),
      onDidCreateFiles: vi.fn(),
      onDidDeleteFiles: vi.fn(),
      onDidOpenTextDocument: vi.fn(),
      onDidRenameFiles: vi.fn(),
    },
  };
});

vi.mock("./document/data.mts", () => ({
  diagnosticCollection: { name: "collection" },
}));

vi.mock("./document/documents.mts", () => ({
  onDidCloseDiagnostics: vi.fn(),
  onDidCreateDiagnostics: vi.fn(),
  onDidCreateFilesDiagnostics: vi.fn(),
  onDidDeleteFilesDiagnostics: vi.fn(),
  onDidEditDiagnostics: vi.fn(),
  onDidRenameFilesDiagnostics: vi.fn(),
}));

vi.mock("./runtime/configure.mts", () => ({
  configure: vi.fn(() => Promise.resolve()),
}));

vi.mock("./runtime/languages.mts", () => ({
  disposeLanguages: vi.fn(),
}));

vi.mock("./runtime/onDidChangeConfiguration.mts", () => ({
  onDidChangeConfiguration: vi.fn(),
}));

vi.mock("./runtime/updateFileSystemWatcher.mts", () => ({
  getWatcher: vi.fn(),
  updateFileSystemWatcher: vi.fn(),
}));

import { diagnosticCollection } from "./document/data.mts";
import { activate, deactivate } from "./extension.mts";
import { configure } from "./runtime/configure.mts";
import { disposeLanguages } from "./runtime/languages.mts";
import { getWatcher } from "./runtime/updateFileSystemWatcher.mts";

describe("activate / deactivate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activate registers subscriptions and calls configure", async () => {
    const subscriptions: any[] = [];
    const ctx = { subscriptions };

    await activate(ctx as any);

    expect(configure).toHaveBeenCalled();
    expect(subscriptions.length).toBeGreaterThan(0);
    expect(subscriptions).toContain(diagnosticCollection);
  });

  it("deactivate disposes watcher and languages", () => {
    const disposeMock = vi.fn();

    (getWatcher as any).mockReturnValue({
      dispose: disposeMock,
    });

    deactivate();

    expect(disposeMock).toHaveBeenCalled();
    expect(disposeLanguages).toHaveBeenCalled();
  });
});
