import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class Hover {
    public contents: unknown;
    public range?: unknown;

    public constructor(contents: unknown, range?: unknown) {
      this.contents = contents;
      this.range = range;
    }
  }

  return {
    Hover,
  };
});

vi.mock("./convertDocumentation.mts", () => ({
  convertDocumentation: vi.fn(),
}));

vi.mock("./convertRange.mts", () => ({
  convertRange: vi.fn(),
}));

import { Hover } from "vscode";
import { convertDocumentation } from "./convertDocumentation.mts";
import { convertHover } from "./convertHover.mts";
import { convertRange } from "./convertRange.mts";

describe("convertHover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a VS Code Hover with converted contents and range when range exists", () => {
    const mockHover = {
      contents: "hover contents",
      range: {
        start: {
          line: 1,
          character: 2,
        },
        end: {
          line: 3,
          character: 4,
        },
      },
    };

    const convertedContents = {
      value: "converted contents",
    };

    const convertedRange = {
      start: "converted-start",
      end: "converted-end",
    };

    vi.mocked(convertDocumentation).mockReturnValue(convertedContents as any);

    vi.mocked(convertRange).mockReturnValue(convertedRange as any);

    const result = convertHover(mockHover);

    expect(convertDocumentation).toHaveBeenCalledTimes(1);

    expect(convertDocumentation).toHaveBeenCalledWith(mockHover.contents);

    expect(convertRange).toHaveBeenCalledTimes(1);

    expect(convertRange).toHaveBeenCalledWith(mockHover.range);

    expect(result).toBeInstanceOf(Hover);

    expect(result).toEqual({
      contents: convertedContents,
      range: convertedRange,
    });
  });

  it("creates a VS Code Hover with only converted contents when range is missing", () => {
    const mockHover = {
      contents: "hover contents",
    };

    const convertedContents = {
      value: "converted contents",
    };

    vi.mocked(convertDocumentation).mockReturnValue(convertedContents as any);

    const result = convertHover(mockHover);

    expect(convertDocumentation).toHaveBeenCalledTimes(1);

    expect(convertDocumentation).toHaveBeenCalledWith(mockHover.contents);

    expect(convertRange).not.toHaveBeenCalled();

    expect(result).toBeInstanceOf(Hover);

    expect(result).toEqual({
      contents: convertedContents,
      range: undefined,
    });
  });
});
