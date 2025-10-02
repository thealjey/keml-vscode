import { MarkdownString } from "vscode";
import {
  MarkedString,
  MarkupContent,
  MarkupKind,
} from "vscode-html-languageservice";

/**
 * Resolves the most appropriate documentation representation type for a given
 * input type.
 *
 * - For {@link MarkupContent}:
 *   - If `kind === MarkupKind.Markdown`, converts to {@link MarkdownString}.
 *   - Otherwise, plain `string`.
 * - For {@link MarkedString} (objects with `language` and `value`):
 *   - Converts to {@link MarkdownString} with a code block.
 * - For plain `string`:
 *   - Returns as `string`.
 * - Otherwise:
 *   - Returns `never` (unsupported).
 *
 * This type-level utility is used to ensure the return type of
 * {@link convertDocumentation} matches the input.
 */
type DocumentationItem<T> = T extends MarkupContent
  ? T["kind"] extends typeof MarkupKind.Markdown
    ? MarkdownString
    : string
  : T extends { language: string; value: string }
  ? MarkdownString
  : T extends string
  ? string
  : never;

/**
 * Handles documentation that may be either a single item or an array of items,
 * producing the appropriately transformed type for each case.
 */
type Documentation<T> = T extends (infer I)[]
  ? DocumentationItem<I>[]
  : DocumentationItem<T>;

/**
 * Converts Language Server Protocol (LSP)-style documentation objects into
 * formats consumable by VS Code APIs.
 *
 * Specifically:
 * - If the input is an **array**, each element is recursively converted.
 * - If the input is a **string**, it is returned unchanged.
 * - If the input is a **{@link MarkupContent}**:
 *   - When `kind === MarkupKind.Markdown`, it is converted into a VS Code
 *     {@link MarkdownString}.
 *   - Otherwise, the raw `.value` string is returned.
 * - If the input is a **{@link MarkedString}** (object with `language` and
 *   `value`), it is converted into a {@link MarkdownString} containing a
 *   code block.
 *
 * This function is typically used when rendering hover tooltips,
 * completion documentation, or signature help in a VS Code extension.
 *
 * @typeParam T - The type of documentation to convert. May be a
 *                {@link MarkupContent}, {@link MarkedString}, `string`,
 *                or an array of those types.
 *
 * @param documentation - The documentation item(s) to convert.
 *
 * @returns The converted documentation, with its type depending on the input.
 *          - {@link MarkdownString} for markdown or code-block content.
 *          - `string` for plain text.
 *          - Arrays of the above when input is an array.
 *
 * @example
 * ```ts
 * import { MarkupContent, MarkupKind } from "vscode-html-languageservice";
 *
 * const doc: MarkupContent = {
 *   kind: MarkupKind.Markdown,
 *   value: "**bold text**"
 * };
 *
 * const converted = convertDocumentation(doc);
 * console.log(converted instanceof MarkdownString); // true
 * ```
 *
 * @example
 * ```ts
 * const doc: MarkedString = {
 *   language: "typescript",
 *   value: "const x: number = 42;"
 * };
 *
 * const converted = convertDocumentation(doc);
 * // => MarkdownString with a TypeScript code block
 * ```
 *
 * @example
 * ```ts
 * const docs = [
 *   { language: "js", value: "console.log('hi');" },
 *   "plain text"
 * ];
 *
 * const converted = convertDocumentation(docs);
 * // => [ MarkdownString(js codeblock), "plain text" ]
 * ```
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
    documentation.language
  ) as Documentation<typeof documentation>;
};
