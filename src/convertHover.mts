import { Hover } from "vscode";
import { Hover as LSHover } from "vscode-html-languageservice";
import { convertDocumentation } from "./convertDocumentation.mts";
import { convertRange } from "./convertRange.mts";

/**
 * Converts a language service hover into a VS Code-compatible hover.
 *
 * @param hover - Hover information from the language service.
 * @returns A hover compatible with VS Code editors.
 */
export const convertHover = ({ contents, range }: LSHover) =>
  range
    ? new extern.Hover(
        extern.convertDocumentation(contents),
        extern.convertRange(range)
      )
    : new extern.Hover(extern.convertDocumentation(contents));

let extern = { Hover, convertDocumentation, convertRange };

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

  describe("convertHover", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("creates Hover with range", () => {
      const mockConvertDocumentation = fn().mockReturnValue("docConverted");
      const mockConvertRange = fn().mockReturnValue("rangeConverted");
      extern.convertDocumentation = mockConvertDocumentation;
      extern.convertRange = mockConvertRange;
      extern.Hover = class {
        constructor(public contents: any, public range?: any) {}
      };

      const hoverInput = { contents: "someContent", range: "r" } as any;
      const result = convertHover(hoverInput);

      expect(result.contents).toBe("docConverted");
      expect(result.range).toBe("rangeConverted");
      expect(mockConvertDocumentation).toHaveBeenCalledWith("someContent");
      expect(mockConvertRange).toHaveBeenCalledWith("r");
    });

    it("creates Hover without range", () => {
      const mockConvertDocumentation = fn().mockReturnValue("docOnly");
      extern.convertDocumentation = mockConvertDocumentation;
      extern.convertRange = fn();
      extern.Hover = class {
        constructor(public contents: any, public range?: any) {}
      };

      const hoverInput = { contents: "contentNoRange" } as any;
      const result = convertHover(hoverInput);

      expect(result.contents).toBe("docOnly");
      expect(result.range).toBeUndefined();
      expect(mockConvertDocumentation).toHaveBeenCalledWith("contentNoRange");
    });
  });
}
/* v8 ignore stop */
