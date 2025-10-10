import { Position } from "vscode";
import { Position as LSPosition } from "vscode-html-languageservice";

/**
 * Converts a language service position into a VS Code-compatible position.
 *
 * @param position - Position from the language service.
 * @returns A position compatible with VS Code editors.
 */
export const convertPosition = ({ line, character }: LSPosition) =>
  new extern.Position(line, character);

let extern = { Position };

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect, afterAll } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("convertPosition", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("creates a new Position with line and character", () => {
      extern.Position = class {
        constructor(public line: number, public character: number) {}
      } as any;

      const input = { line: 5, character: 10 } as any;
      const result = convertPosition(input);

      expect(result.line).toBe(5);
      expect(result.character).toBe(10);
    });
  });
}
/* v8 ignore stop */
