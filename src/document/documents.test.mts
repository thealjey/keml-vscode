import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  workspace: {
    openTextDocument: vi.fn((uri: { fsPath: string }) => {
      if (uri.fsPath === "invalid") {
        throw new Error("doc error");
      }
      return "text doc";
    }),
    findFiles: vi.fn(() => Promise.resolve(["file uri"])),
    textDocuments: { forEach: vi.fn() },
  },
  window: { showErrorMessage: vi.fn() },
}));

vi.mock("./Document.mts", () => ({
  Document: class {
    constructor(public doc: any) {}
  },
}));

vi.mock("./data.mts", () => ({
  config: {},
  documents: new Map(),
}));

vi.mock("./updateDiagnosticCollection.mts", () => ({
  updateDiagnosticCollection: vi.fn(),
}));

import { window, workspace } from "vscode";
import { config, documents } from "./data.mts";
import { Document } from "./Document.mts";
import {
  onDidChange,
  onDidClose,
  onDidCreate,
  onDidDeleteUri,
  onDidEdit,
  onDidRename,
  populateDocs,
  pruneDocs,
  withDiagnostics,
  withDiagnosticsAsync,
  withFiles,
  withFilesAsync,
  withUri,
} from "./documents.mts";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection.mts";

describe("documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documents.clear();
    Document.isApplicable = () => true;
  });

  it("not applicable", () => {
    Document.isApplicable = () => false;
    onDidCreate({ uri: "uri", languageId: "foo" } as any);
    expect(documents.size).toBe(0);
  });

  it("applicable, not present", () => {
    onDidChange({ uri: "uri", languageId: "foo" } as any);
    expect(documents.size).toBe(0);
  });

  it("applicable, present", () => {
    onDidCreate({ uri: "uri", languageId: "foo" } as any);
    onDidChange({ uri: "uri2", languageId: "foo2" } as any);
    expect(Array.from(documents.entries())).toMatchObject([
      ["uri", { doc: { languageId: "foo", uri: "uri" } }],
    ]);
  });

  it("withDiagnostics", () => {
    const fn = vi.fn().mockReturnValue("foo");
    const wrapped = withDiagnostics(fn);
    expect(wrapped("bar")).toBe("foo");
    expect(updateDiagnosticCollection).toHaveBeenCalled();
  });

  it("withDiagnosticsAsync", async () => {
    const fn = vi.fn().mockResolvedValue("foo");
    const wrapped = withDiagnosticsAsync(fn);
    expect(await wrapped("bar")).toBe("foo");
    expect(updateDiagnosticCollection).toHaveBeenCalled();
  });

  it("withUri", async () => {
    const fn = vi.fn().mockResolvedValue("foo");
    const wrapped = withUri(fn);
    await wrapped({ fsPath: "invalid" } as any);
    expect(window.showErrorMessage).toHaveBeenCalledWith(
      "Failed to open invalid. Error: doc error",
    );
    expect(await wrapped({ fsPath: "bar" } as any)).toBe("foo");
    expect(workspace.openTextDocument).toHaveBeenCalledWith({ fsPath: "bar" });
    expect(fn).toHaveBeenCalledWith("text doc");
  });

  it("withFiles", () => {
    const fn = vi.fn().mockReturnValue("foo");
    const wrapped = withFiles(fn);
    expect(wrapped({ files: ["bar"] })).toMatchObject(["foo"]);
    expect(fn).toHaveBeenCalledWith("bar", 0, ["bar"]);
  });

  it("withFilesAsync", async () => {
    const fn = vi.fn().mockResolvedValue("foo");
    const wrapped = withFilesAsync(fn);
    expect(await wrapped({ files: ["bar"] })).toMatchObject(["foo"]);
    expect(fn).toHaveBeenCalledWith("bar", 0, ["bar"]);
  });

  it("onDidEdit", () => {
    const e = { document: { uri: "uri" } } as any;
    const update = vi.fn().mockReturnValue("bar");
    documents.set("uri", { update } as any);
    expect(onDidEdit(e)).toBe("bar");
    expect(update).toHaveBeenCalledWith(e);
  });

  it("onDidRename", () => {
    const doc = { uri: "old" } as any;
    documents.set("old", doc);
    onDidRename({ oldUri: "wrong", newUri: "new" } as any);
    expect(documents.get("old")).toBe(doc);
    expect(documents.get("new")).toBeUndefined();
    expect(doc.uri).toBe("old");
    onDidRename({ oldUri: "old", newUri: "new" } as any);
    expect(documents.get("old")).toBeUndefined();
    expect(documents.get("new")).toBe(doc);
    expect(doc.uri).toBe("new");
  });

  it("onDidDeleteUri", () => {
    documents.set("uri", {} as any);
    onDidDeleteUri("uri" as any);
    expect(documents.size).toBe(0);
  });

  it("onDidClose", () => {
    documents.set("uri", {} as any);
    onDidClose({ uri: { toString: () => "uri", scheme: "file" } } as any);
    expect(documents.size).toBe(1);
    onDidClose({ uri: { toString: () => "uri", scheme: "memory" } } as any);
    expect(documents.size).toBe(0);
  });

  it("populateDocs", async () => {
    config.EXT_GLOB = null;
    await populateDocs();
    expect(workspace.textDocuments.forEach).toHaveBeenCalledWith(onDidCreate);
    expect(workspace.findFiles).not.toHaveBeenCalled();
    config.EXT_GLOB = "hello world";
    await populateDocs();
    expect(workspace.findFiles).toHaveBeenCalledWith("hello world");
    expect(workspace.openTextDocument).toHaveBeenCalledWith("file uri");
  });

  it("pruneDocs", () => {
    let app = true;
    const doc = { isApplicable: () => app } as any;
    documents.set("uri", doc);
    pruneDocs();
    expect(documents.size).toBe(1);
    app = false;
    pruneDocs();
    expect(documents.size).toBe(0);
    documents.set("uri", doc);
    app = true;
    doc.diagnostics = { hasLog: true };
    pruneDocs(true);
    expect(documents.size).toBe(0);
  });
});
