import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Mocks
// --------------------

const provideDocumentHighlightsMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn(),
    },
  };
});

// Import AFTER mocks
import { documents } from "../document/data.mts";
import { documentHighlightProvider } from "./documentHighlightProvider.mts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("documentHighlightProvider", () => {
  it("returns document highlights when not cancelled", () => {
    (documents.get as any).mockReturnValue({
      provideDocumentHighlights: provideDocumentHighlightsMock.mockReturnValue([
        { range: "H1" },
      ]),
    });

    const result = documentHighlightProvider.provideDocumentHighlights(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 10, character: 5 } as any,
      { isCancellationRequested: false } as any,
    );

    expect(documents.get).toHaveBeenCalledWith("file://test.ts");
    expect(provideDocumentHighlightsMock).toHaveBeenCalledWith({
      line: 10,
      character: 5,
    });
    expect(result).toEqual([{ range: "H1" }]);
  });

  it("returns undefined when cancelled", () => {
    const result = documentHighlightProvider.provideDocumentHighlights(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 10, character: 5 } as any,
      { isCancellationRequested: true } as any,
    );

    expect(result).toBeUndefined();
    expect(documents.get).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    (documents.get as any).mockReturnValue(undefined);

    const result = documentHighlightProvider.provideDocumentHighlights(
      { uri: { toString: () => "file://missing.ts" } } as any,
      { line: 10, character: 5 } as any,
      { isCancellationRequested: false } as any,
    );

    expect(result).toBeUndefined();
  });
});
