import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class TextEdit {
    public range: unknown;
    public newText: string;

    public constructor(range: unknown, newText: string) {
      this.range = range;
      this.newText = newText;
    }
  }

  return {
    TextEdit,
  };
});

vi.mock("./convertRange.mts", () => ({
  convertRange: vi.fn(),
}));

import { TextEdit } from "vscode";
import { convertRange } from "./convertRange.mts";
import { convertTextEdit } from "./convertTextEdit.mts";

describe("convertTextEdit", () => {
  it("creates a VS Code TextEdit using the converted range and new text", () => {
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

    const convertedRange = {
      start: "converted-start",
      end: "converted-end",
    };

    vi.mocked(convertRange).mockReturnValue(convertedRange as any);

    const result = convertTextEdit({
      range: mockRange,
      newText: "hello world",
    });

    expect(convertRange).toHaveBeenCalledTimes(1);
    expect(convertRange).toHaveBeenCalledWith(mockRange);

    expect(result).toBeInstanceOf(TextEdit);
    expect(result).toEqual({
      range: convertedRange,
      newText: "hello world",
    });
  });
});
