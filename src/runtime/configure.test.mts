import { beforeEach, describe, expect, it, vi } from "vitest";
import { configure } from "./configure.mts";

// --------------------
// Mocks (all isolated, no external mock variables)
// --------------------

vi.mock("vscode", () => {
  const getConfiguration = vi.fn();

  return {
    DiagnosticSeverity: {
      Error: 0,
      Warning: 1,
      Information: 2,
      Hint: 3,
    },
    workspace: {
      getConfiguration,
    },
  };
});

vi.mock("../document/data.mts", () => {
  const setGlobs = vi.fn();
  const setLanguageIds = vi.fn();

  return {
    config: {},
    setGlobs,
    setLanguageIds,
  };
});

vi.mock("../document/documents.mts", () => {
  return {
    pruneDocs: vi.fn(),
    populateDocs: vi.fn(),
  };
});

vi.mock("../document/updateDiagnosticCollection.mts", () => {
  return {
    updateDiagnosticCollection: vi.fn(),
  };
});

vi.mock("../util/get.mts", () => {
  return {
    get: (v: any, i: number) => v[i],
  };
});

vi.mock("./getAllLanguageExtensions.mts", () => {
  return {
    getAllLanguageExtensions: vi.fn(),
  };
});

vi.mock("./languages.mts", () => {
  return {
    pruneLanguages: vi.fn(),
    populateLanguages: vi.fn(),
  };
});

vi.mock("./updateFileSystemWatcher.mts", () => {
  return {
    updateFileSystemWatcher: vi.fn(),
  };
});

// --------------------
// Imports AFTER mocks
// --------------------

import { workspace } from "vscode";
import { config, setGlobs, setLanguageIds } from "../document/data.mts";
import { populateDocs, pruneDocs } from "../document/documents.mts";
import { updateDiagnosticCollection } from "../document/updateDiagnosticCollection.mts";
import { getAllLanguageExtensions } from "./getAllLanguageExtensions.mts";
import { populateLanguages, pruneLanguages } from "./languages.mts";
import { updateFileSystemWatcher } from "./updateFileSystemWatcher.mts";

const getConfiguration = workspace.getConfiguration as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(getAllLanguageExtensions).mockReturnValue(["ts", "js"]);

  getConfiguration.mockImplementation((section: string) => {
    if (section === "search") {
      return {
        get: (key: string) => {
          if (key === "exclude") {
            return { "**/node_modules": true, "**/dist": false };
          }
          return {};
        },
      };
    }

    if (section === "keml") {
      return {
        get: (key: string, def: any) => {
          const map: Record<string, any> = {
            include: ["**/*.ts"],
            languageIds: ["ts"],
            actionUndefinedSeverity: "Error",
            actionUnusedSeverity: "Warning",
            warnOnLogAttribute: true,
          };

          return map[key] ?? def;
        },
      };
    }

    return {
      get: (_: string, def: any) => def,
    };
  });
});

describe("configure", () => {
  it("runs full configuration pipeline", async () => {
    await configure(true);

    expect(setGlobs).toHaveBeenCalled();
    expect(setLanguageIds).toHaveBeenCalled();

    expect(pruneDocs).toHaveBeenCalledWith(true);
    expect(pruneLanguages).toHaveBeenCalled();

    expect(populateDocs).toHaveBeenCalled();
    expect(populateLanguages).toHaveBeenCalled();

    expect(updateDiagnosticCollection).toHaveBeenCalled();
    expect(updateFileSystemWatcher).toHaveBeenCalled();

    expect(getAllLanguageExtensions).toHaveBeenCalled();
  });

  it("sets EXT_GLOB when extensions exist", async () => {
    await configure();

    expect(config.EXT_GLOB).toBe("**/*.{ts,js}");
  });

  it("sets EXT_GLOB to null when no extensions exist", async () => {
    vi.mocked(getAllLanguageExtensions).mockReturnValue([]);

    await configure();

    expect(config.EXT_GLOB).toBeNull();
  });
});
