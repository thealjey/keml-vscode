import { beforeEach, describe, expect, it, vi } from "vitest";

const diagnostics = vi.hoisted(() => {
  return {
    onDidChangeUriDiagnostics: vi.fn(),
    onDidCreateUriDiagnostics: vi.fn(),
    onDidDeleteUriDiagnostics: vi.fn(),
  };
});

vi.mock("vscode", () => {
  const workspace = {
    createFileSystemWatcher: vi.fn(),
  };

  return { workspace };
});

vi.mock("../document/data.mts", () => ({
  config: {},
}));

vi.mock("../document/documents.mts", () => diagnostics);

import { workspace } from "vscode";
import {
  getWatcher,
  updateFileSystemWatcher,
} from "./updateFileSystemWatcher.mts";

import { config } from "../document/data.mts";
import {
  onDidChangeUriDiagnostics,
  onDidCreateUriDiagnostics,
  onDidDeleteUriDiagnostics,
} from "../document/documents.mts";

describe("watcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not create watcher when config.EXT_GLOB is falsy", () => {
    config.EXT_GLOB = null;

    updateFileSystemWatcher();

    expect(workspace.createFileSystemWatcher).not.toHaveBeenCalled();
    expect(getWatcher()).toBeUndefined();
  });

  it("creates watcher and registers handlers", () => {
    config.EXT_GLOB = "**/*.ts";
    const fakeWatcher = {
      onDidChange: vi.fn(),
      onDidCreate: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn(),
    };

    vi.mocked(workspace.createFileSystemWatcher).mockReturnValue(
      fakeWatcher as any,
    );

    updateFileSystemWatcher();

    expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith("**/*.ts");

    expect(fakeWatcher.onDidChange).toHaveBeenCalledWith(
      onDidChangeUriDiagnostics,
    );

    expect(fakeWatcher.onDidCreate).toHaveBeenCalledWith(
      onDidCreateUriDiagnostics,
    );

    expect(fakeWatcher.onDidDelete).toHaveBeenCalledWith(
      onDidDeleteUriDiagnostics,
    );

    expect(getWatcher()).toBe(fakeWatcher);
  });
});
