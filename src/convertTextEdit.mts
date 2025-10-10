import { TextEdit } from "vscode";
import { TextEdit as LSTextEdit } from "vscode-html-languageservice";
import { convertRange } from "./convertRange.mts";

/**
 * Converts a language service text edit into a VS Code-compatible text edit.
 *
 * @param textEdit - Text edit from the language service.
 * @returns A text edit compatible with VS Code editors.
 */
export const convertTextEdit = ({ range, newText }: LSTextEdit) =>
  new extern.TextEdit(extern.convertRange(range), newText);

let extern = { TextEdit, convertRange };

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

  describe("convertTextEdit", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("converts a TextEdit using convertRange", () => {
      const mockConvertRange = fn().mockReturnValue("convertedRange");
      extern.convertRange = mockConvertRange;
      extern.TextEdit = class {
        constructor(public range: any, public newText: string) {}
      } as any;

      const input = { range: { start: 0, end: 1 }, newText: "hello" } as any;
      const result = convertTextEdit(input);

      expect(result.range).toBe("convertedRange");
      expect(result.newText).toBe("hello");
      expect(mockConvertRange).toHaveBeenCalledWith(input.range);
    });
  });
}
/* v8 ignore stop */
