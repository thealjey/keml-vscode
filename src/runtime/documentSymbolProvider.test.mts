import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Mocks
// --------------------

const provideDocumentSymbolsMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn(),
    },
  };
});

// Import AFTER mocks
import { documents } from "../document/data.mts";
import { documentSymbolProvider } from "./documentSymbolProvider.mts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("documentSymbolProvider", () => {
  it("returns document symbols when not cancelled", () => {
    (documents.get as any).mockReturnValue({
      provideDocumentSymbols: provideDocumentSymbolsMock.mockReturnValue([
        { name: "SymbolA" },
      ]),
    });

    const result = documentSymbolProvider.provideDocumentSymbols(
      { uri: { toString: () => "file://test.ts" } } as any,
      { isCancellationRequested: false } as any,
    );

    expect(documents.get).toHaveBeenCalledWith("file://test.ts");
    expect(provideDocumentSymbolsMock).toHaveBeenCalled();
    expect(result).toEqual([{ name: "SymbolA" }]);
  });

  it("returns undefined when cancelled", () => {
    const result = documentSymbolProvider.provideDocumentSymbols(
      { uri: { toString: () => "file://test.ts" } } as any,
      { isCancellationRequested: true } as any,
    );

    expect(result).toBeUndefined();
    expect(documents.get).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    (documents.get as any).mockReturnValue(undefined);

    const result = documentSymbolProvider.provideDocumentSymbols(
      { uri: { toString: () => "file://missing.ts" } } as any,
      { isCancellationRequested: false } as any,
    );

    expect(result).toBeUndefined();
  });
});
