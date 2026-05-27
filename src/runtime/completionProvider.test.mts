import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Mocks
// --------------------

const provideCompletionItemsMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn(),
    },
  };
});

// Import AFTER mocks
import { documents } from "../document/data.mts";
import { completionProvider } from "./completionProvider.mts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("completionProvider", () => {
  it("returns completion items when not cancelled", () => {
    (documents.get as any).mockReturnValue({
      provideCompletionItems: provideCompletionItemsMock.mockReturnValue([
        { label: "item1" },
        { label: "item2" },
      ]),
    });

    const result = completionProvider.provideCompletionItems(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 5, character: 10 } as any,
      { isCancellationRequested: false } as any,
      {} as any,
    );

    expect(documents.get).toHaveBeenCalledWith("file://test.ts");
    expect(provideCompletionItemsMock).toHaveBeenCalledWith({
      line: 5,
      character: 10,
    });
    expect(result).toEqual([{ label: "item1" }, { label: "item2" }]);
  });

  it("returns undefined when cancelled", () => {
    const result = completionProvider.provideCompletionItems(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 5, character: 10 } as any,
      { isCancellationRequested: true } as any,
      {} as any,
    );

    expect(result).toBeUndefined();
    expect(documents.get).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    (documents.get as any).mockReturnValue(undefined);

    const result = completionProvider.provideCompletionItems(
      { uri: { toString: () => "file://missing.ts" } } as any,
      { line: 5, character: 10 } as any,
      { isCancellationRequested: false } as any,
      {} as any,
    );

    expect(result).toBeUndefined();
  });
});
