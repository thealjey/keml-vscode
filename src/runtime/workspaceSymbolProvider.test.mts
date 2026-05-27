import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class Uri {
    public constructor(public value: string) {}

    public static file(path: string) {
      return new Uri(`file://${path}`);
    }

    public toString() {
      return this.value;
    }
  }

  class Location {
    public constructor(
      public uri: any,
      public range: any,
    ) {}
  }

  class SymbolInformation {
    public name: string;
    public kind: any;
    public containerName: string;
    public location: Location;

    public constructor(
      name: string,
      kind: any,
      containerName: string,
      location: Location,
    ) {
      this.name = name;
      this.kind = kind;
      this.containerName = containerName;
      this.location = location;
    }
  }

  const SymbolKind = {
    Constant: 1,
  };

  return {
    Uri,
    Location,
    SymbolInformation,
    SymbolKind,
  };
});

vi.mock("../document/data.mts", () => ({
  documents: {
    values: vi.fn(),
  },
}));

import { SymbolKind, Uri } from "vscode";
import { documents } from "../document/data.mts";
import { workspaceSymbolProvider } from "./workspaceSymbolProvider.mts";

describe("workspaceSymbolProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined when cancelled", async () => {
    const result = await workspaceSymbolProvider.provideWorkspaceSymbols(
      "test",
      { isCancellationRequested: true } as any,
    );

    expect(result).toBeUndefined();
  });

  it("returns symbol from definitions", async () => {
    const range = {
      start: { line: 1, character: 1 },
      end: { line: 1, character: 5 },
    };

    const registryEntry = {
      definitions: {
        get: vi.fn().mockReturnValue([range]),
      },
      references: {
        get: vi.fn(),
      },
    };

    vi.mocked(documents.values).mockReturnValue([
      {
        uri: Uri.file("/test.ts"),
        identifiers: {
          registry: {
            values: () => [registryEntry],
          },
        },
      },
    ] as any);

    const result = await workspaceSymbolProvider.provideWorkspaceSymbols(
      "mySymbol",
      { isCancellationRequested: false } as any,
    );

    expect(result).toBeDefined();
    expect(result?.length).toBe(1);

    const symbol = result![0]!;

    expect(symbol.name).toBe("mySymbol");
    expect(symbol.kind).toBe(SymbolKind.Constant);
    expect(symbol.containerName).toBe("");

    expect(symbol.location.uri.toString()).toBe(
      Uri.file("/test.ts").toString(),
    );
  });

  it("falls back to references when definitions missing", async () => {
    const range = {
      start: { line: 2, character: 2 },
      end: { line: 2, character: 6 },
    };

    const registryEntry = {
      definitions: {
        get: vi.fn().mockReturnValue(undefined),
      },
      references: {
        get: vi.fn().mockReturnValue([range]),
      },
    };

    vi.mocked(documents.values).mockReturnValue([
      {
        uri: Uri.file("/test2.ts"),
        identifiers: {
          registry: {
            values: () => [registryEntry],
          },
        },
      },
    ] as any);

    const result = await workspaceSymbolProvider.provideWorkspaceSymbols(
      "mySymbol",
      { isCancellationRequested: false } as any,
    );

    expect(result).toBeDefined();
    expect(result?.length).toBe(1);

    expect(result![0]!.location.uri.toString()).toBe(
      Uri.file("/test2.ts").toString(),
    );
  });

  it("returns empty result when both definitions and references are nullish", async () => {
    const registryEntry = {
      definitions: {
        get: vi.fn().mockReturnValue(undefined),
      },
      references: {
        get: vi.fn().mockReturnValue(undefined),
      },
    };

    vi.mocked(documents.values).mockReturnValue([
      {
        uri: Uri.file("/no-match.ts"),
        identifiers: {
          registry: {
            values: () => [registryEntry],
          },
        },
      },
    ] as any);

    const result = await workspaceSymbolProvider.provideWorkspaceSymbols(
      "missingSymbol",
      { isCancellationRequested: false } as any,
    );

    expect(result).toEqual([]);
  });
});
