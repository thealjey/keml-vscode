import { Range } from "vscode";
import { Range as LSRange } from "vscode-html-languageservice";
import { convertPosition } from "./convertPosition.mts";

/**
 * Converts a language service range into a VS Code-compatible range.
 *
 * @param range - Range from the language service.
 * @returns A range compatible with VS Code editors.
 */
export const convertRange = ({ start, end }: LSRange) =>
  new extern.Range(extern.convertPosition(start), extern.convertPosition(end));

let extern = { Range, convertPosition };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("convertRange", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("converts start and end positions into a Range", () => {
      const mockConvertPosition = fn().mockImplementation(
        ({ line, character }) => ({ line, character })
      );
      extern.convertPosition = mockConvertPosition;
      extern.Range = class {
        constructor(public start: any, public end: any) {}
      } as any;

      const input = {
        start: { line: 1, character: 2 },
        end: { line: 3, character: 4 },
      } as any;

      const result = convertRange(input);

      expect(result.start).toEqual({ line: 1, character: 2 });
      expect(result.end).toEqual({ line: 3, character: 4 });
      expect(mockConvertPosition).toHaveBeenCalledWith(input.start);
      expect(mockConvertPosition).toHaveBeenCalledWith(input.end);
    });
  });
}
/* v8 ignore stop */
