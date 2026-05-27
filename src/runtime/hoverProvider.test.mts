import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Mocks
// --------------------

const provideHoverMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn(),
    },
  };
});

// Import AFTER mock
import { documents } from "../document/data.mts";
import { hoverProvider } from "./hoverProvider.mts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hoverProvider", () => {
  it("returns hover result when not cancelled", () => {
    (documents.get as any).mockReturnValue({
      provideHover: provideHoverMock.mockReturnValue("HOVER_RESULT"),
    });

    const result = hoverProvider.provideHover(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 1, character: 2 } as any,
      { isCancellationRequested: false } as any,
    );

    expect(documents.get).toHaveBeenCalledWith("file://test.ts");
    expect(provideHoverMock).toHaveBeenCalledWith({
      line: 1,
      character: 2,
    });
    expect(result).toBe("HOVER_RESULT");
  });

  it("returns undefined when cancelled", () => {
    const result = hoverProvider.provideHover(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 1, character: 2 } as any,
      { isCancellationRequested: true } as any,
    );

    expect(result).toBeUndefined();
    expect(documents.get).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    (documents.get as any).mockReturnValue(undefined);

    const result = hoverProvider.provideHover(
      { uri: { toString: () => "file://missing.ts" } } as any,
      { line: 1, character: 2 } as any,
      { isCancellationRequested: false } as any,
    );

    expect(result).toBeUndefined();
  });
});
