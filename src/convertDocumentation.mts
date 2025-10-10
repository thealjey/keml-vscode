import { MarkdownString } from "vscode";
import {
  MarkedString,
  MarkupContent,
  MarkupKind,
} from "vscode-html-languageservice";

type DocumentationItem<T> = T extends MarkupContent
  ? T["kind"] extends typeof MarkupKind.Markdown
    ? MarkdownString
    : string
  : T extends { language: string; value: string }
  ? MarkdownString
  : T extends string
  ? string
  : never;

type Documentation<T> = T extends (infer I)[]
  ? DocumentationItem<I>[]
  : DocumentationItem<T>;

/**
 * Converts a language service documentation into a VS Code-compatible
 * documentation format.
 *
 * @param documentation - The original documentation from the language service.
 * @returns Documentation compatible with VS Code editors.
 */
export const convertDocumentation = <
  T extends MarkupContent | MarkedString | (MarkupContent | MarkedString)[]
>(
  documentation: T
): Documentation<T> => {
  if (Array.isArray(documentation)) {
    return documentation.map(convertDocumentation) as Documentation<
      typeof documentation
    >;
  }
  if (typeof documentation === "string") {
    return documentation as unknown as Documentation<typeof documentation>;
  }
  if (extern.MarkupContent.is(documentation)) {
    if (documentation.kind === MarkupKind.Markdown) {
      return new extern.MarkdownString(documentation.value) as Documentation<
        typeof documentation
      >;
    }
    return documentation.value as Documentation<typeof documentation>;
  }
  return new extern.MarkdownString().appendCodeblock(
    documentation.value,
    documentation.language
  ) as Documentation<typeof documentation>;
};

let extern = { MarkdownString, MarkupContent };

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

  describe("convertDocumentation", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns string as is", () => {
      const result = convertDocumentation("plain string");
      expect(result).toBe("plain string");
    });

    it("maps array of documentation recursively", () => {
      const result = convertDocumentation(["a", "b"] as any);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["a", "b"]);
    });

    it("converts MarkupContent with Markdown kind to MarkdownString", () => {
      const mockMarkdownString = fn(function (this: any, val?: string) {
        this.value = val;
      });
      extern.MarkdownString = mockMarkdownString as any;
      extern.MarkupContent = { is: fn().mockReturnValue(true) } as any;
      const doc = { kind: "markdown", value: "mdvalue" };
      const result = convertDocumentation(doc as any);
      expect((result as any).value).toBe("mdvalue");
    });

    it("returns MarkupContent value if kind is plaintext", () => {
      extern.MarkupContent = { is: fn().mockReturnValue(true) } as any;
      const doc = { kind: "plaintext", value: "textvalue" };
      const result = convertDocumentation(doc as any);
      expect(result).toBe("textvalue");
    });

    it("converts object with language and value to MarkdownString with appendCodeblock", () => {
      const appendCodeblockMock = fn().mockReturnThis();
      const mockMarkdownString = fn(function (this: any) {
        this.appendCodeblock = appendCodeblockMock;
      });
      extern.MarkdownString = mockMarkdownString as any;
      extern.MarkupContent = { is: fn().mockReturnValue(false) } as any;
      const doc = { language: "ts", value: "code" };
      convertDocumentation(doc as any);
      expect(appendCodeblockMock).toHaveBeenCalledWith("code", "ts");
    });
  });
}
/* v8 ignore stop */
