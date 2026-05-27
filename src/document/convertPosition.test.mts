import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class Position {
    public line: number;
    public character: number;

    public constructor(line: number, character: number) {
      this.line = line;
      this.character = character;
    }
  }

  return {
    Position,
  };
});

import { Position } from "vscode";
import { convertPosition } from "./convertPosition.mts";

describe("convertPosition", () => {
  it("creates a VS Code Position using the language service position values", () => {
    const mockPosition = {
      line: 12,
      character: 34,
    };

    const result = convertPosition(mockPosition);

    expect(result).toBeInstanceOf(Position);

    expect(result).toEqual({
      line: 12,
      character: 34,
    });
  });
});
