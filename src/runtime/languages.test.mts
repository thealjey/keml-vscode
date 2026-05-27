import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Mocks
// --------------------

const disposeMock = vi.fn();

vi.mock("vscode", () => {
  return {
    languages: {
      registerCompletionItemProvider: vi.fn(() => ({ dispose: disposeMock })),
      registerDocumentHighlightProvider: vi.fn(() => ({
        dispose: disposeMock,
      })),
      registerDocumentSymbolProvider: vi.fn(() => ({ dispose: disposeMock })),
      registerWorkspaceSymbolProvider: vi.fn(() => ({ dispose: disposeMock })),
      registerDefinitionProvider: vi.fn(() => ({ dispose: disposeMock })),
      registerReferenceProvider: vi.fn(() => ({ dispose: disposeMock })),
      registerRenameProvider: vi.fn(() => ({ dispose: disposeMock })),
      registerHoverProvider: vi.fn(() => ({ dispose: disposeMock })),
    },
  };
});

vi.mock("../document/data.mts", () => {
  return {
    getLanguageIds: vi.fn(),
    matchLanguageId: vi.fn(),
  };
});

// Import AFTER mocks
import { languages } from "vscode";
import { getLanguageIds, matchLanguageId } from "../document/data.mts";

import {
  disposeLanguages,
  languageDisposables,
  populateLanguages,
  pruneLanguages,
} from "./languages.mts";

// --------------------
// Tests
// --------------------

beforeEach(() => {
  vi.clearAllMocks();
  languageDisposables.clear();
});

describe("languages module", () => {
  it("populates languages and registers providers", () => {
    (getLanguageIds as any).mockReturnValue(["ts", "js"]);

    populateLanguages();

    expect(languageDisposables.size).toBe(2);
    expect(languageDisposables.get("ts")?.length).toBe(8);
    expect(languageDisposables.get("js")?.length).toBe(8);

    expect(languages.registerCompletionItemProvider).toHaveBeenCalled();
    expect(languages.registerHoverProvider).toHaveBeenCalled();
  });

  it("does not re-register existing language IDs", () => {
    (getLanguageIds as any).mockReturnValue(["ts"]);

    populateLanguages();
    populateLanguages();

    expect(languageDisposables.size).toBe(1);
  });

  it("prunes languages that do not match", () => {
    (getLanguageIds as any).mockReturnValue(["ts", "js"]);
    (matchLanguageId as any).mockImplementation((id: string) => id === "ts");

    populateLanguages();
    pruneLanguages();

    expect(languageDisposables.has("js")).toBe(false);
    expect(languageDisposables.has("ts")).toBe(true);

    // disposables for js should be disposed
    expect(disposeMock).toHaveBeenCalled();
  });

  it("disposes all languages and clears map", () => {
    (getLanguageIds as any).mockReturnValue(["ts"]);

    populateLanguages();
    disposeLanguages();

    expect(languageDisposables.size).toBe(0);
    expect(disposeMock).toHaveBeenCalled();
  });
});
