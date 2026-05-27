import { beforeEach, describe, expect, it, vi } from "vitest";

// --------------------
// Mocks
// --------------------

const provideDefinitionMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn(),
    },
  };
});

// Import AFTER mocks
import { documents } from "../document/data.mts";
import { definitionProvider } from "./definitionProvider.mts";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("definitionProvider", () => {
  it("returns definition when not cancelled", () => {
    (documents.get as any).mockReturnValue({
      provideDefinition: provideDefinitionMock.mockReturnValue({
        uri: "file://def.ts",
        range: "R1",
      }),
    });

    const result = definitionProvider.provideDefinition(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 3, character: 8 } as any,
      { isCancellationRequested: false } as any,
    );

    expect(documents.get).toHaveBeenCalledWith("file://test.ts");
    expect(provideDefinitionMock).toHaveBeenCalledWith({
      line: 3,
      character: 8,
    });
    expect(result).toEqual({
      uri: "file://def.ts",
      range: "R1",
    });
  });

  it("returns undefined when cancelled", () => {
    const result = definitionProvider.provideDefinition(
      { uri: { toString: () => "file://test.ts" } } as any,
      { line: 3, character: 8 } as any,
      { isCancellationRequested: true } as any,
    );

    expect(result).toBeUndefined();
    expect(documents.get).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    (documents.get as any).mockReturnValue(undefined);

    const result = definitionProvider.provideDefinition(
      { uri: { toString: () => "file://missing.ts" } } as any,
      { line: 3, character: 8 } as any,
      { isCancellationRequested: false } as any,
    );

    expect(result).toBeUndefined();
  });
});
