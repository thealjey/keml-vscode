import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class Range {
    public start: unknown;
    public end: unknown;

    public constructor(start: unknown, end: unknown) {
      this.start = start;
      this.end = end;
    }
  }

  return {
    Range,
  };
});

vi.mock("./convertPosition.mts", () => ({
  convertPosition: vi.fn(),
}));

import { Range } from "vscode";
import { convertPosition } from "./convertPosition.mts";
import { convertRange } from "./convertRange.mts";

describe("convertRange", () => {
  it("creates a VS Code Range using converted start and end positions", () => {
    const mockRange = {
      start: {
        line: 1,
        character: 2,
      },
      end: {
        line: 3,
        character: 4,
      },
    };

    const convertedStart = {
      line: "converted-start-line",
      character: "converted-start-character",
    };

    const convertedEnd = {
      line: "converted-end-line",
      character: "converted-end-character",
    };

    vi.mocked(convertPosition)
      .mockReturnValueOnce(convertedStart as any)
      .mockReturnValueOnce(convertedEnd as any);

    const result = convertRange(mockRange);

    expect(convertPosition).toHaveBeenCalledTimes(2);

    expect(convertPosition).toHaveBeenNthCalledWith(1, mockRange.start);

    expect(convertPosition).toHaveBeenNthCalledWith(2, mockRange.end);

    expect(result).toBeInstanceOf(Range);

    expect(result).toEqual({
      start: convertedStart,
      end: convertedEnd,
    });
  });
});
