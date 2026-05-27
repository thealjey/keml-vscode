import { MarkdownString } from "vscode";
import {
  MarkupContent,
  MarkupKind,
  type MarkedString,
} from "vscode-html-languageservice";

type DocumentationItem<T> =
  T extends MarkupContent ?
    T["kind"] extends typeof MarkupKind.Markdown ?
      MarkdownString
    : string
  : T extends { language: string; value: string } ? MarkdownString
  : T extends string ? string
  : never;

type Documentation<T> =
  T extends (infer I)[] ? DocumentationItem<I>[] : DocumentationItem<T>;

/**
 * Transforms language service documentation into a format usable by VSCode
 * APIs.
 *
 * Supports markdown, code blocks, and plain string representations.
 */
export const convertDocumentation = <
  T extends MarkupContent | MarkedString | (MarkupContent | MarkedString)[],
>(
  documentation: T,
): Documentation<T> => {
  if (Array.isArray(documentation)) {
    return documentation.map(convertDocumentation) as Documentation<
      typeof documentation
    >;
  }
  if (typeof documentation === "string") {
    return documentation as unknown as Documentation<typeof documentation>;
  }
  if (MarkupContent.is(documentation)) {
    if (documentation.kind === MarkupKind.Markdown) {
      return new MarkdownString(documentation.value) as Documentation<
        typeof documentation
      >;
    }
    return documentation.value as Documentation<typeof documentation>;
  }
  return new MarkdownString().appendCodeblock(
    documentation.value,
    documentation.language,
  ) as Documentation<typeof documentation>;
};
