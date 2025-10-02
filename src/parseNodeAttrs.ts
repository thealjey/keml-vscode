import { Range } from "vscode";
import { Node, TextDocument, TokenType } from "vscode-html-languageservice";
import { convertPosition } from "./convertPosition";
import { service } from "./service";

/**
 * Represents a parsed attribute of an HTML node with detailed positional
 * information for use in a VS Code extension.
 */
interface Attr {
  /**
   * The name of the attribute (e.g., "id", "class", "onclick")
   */
  name: string;

  /**
   * The value of the attribute, with surrounding quotes removed.
   */
  value: string;

  /**
   * The offset of the value's first character within the document.
   */
  offset: number;

  /**
   * The offset of the value's last character within the document.
   */
  end: number;

  /**
   * VS Code `Range` covering only the attribute value.
   */
  range: Range;

  /**
   * VS Code `Range` covering the full attribute including name and value.
   */
  fullRange: Range;
}

const HEAD_PATTERN = /^(?:\s*["'])?/;
const TAIL_PATTERN = /(?:["']\s*)?$/;

/**
 * Parses all attributes of a given HTML node and yields detailed information
 * about each attribute, including its name, value, offsets, and VS Code ranges.
 *
 * This generator function uses the HTML language service scanner to accurately
 * locate attribute names and values within the text of a document. It handles
 * trimming surrounding quotes from attribute values.
 *
 * @param textDoc - The text document containing the HTML content.
 * @param node - The HTML node to parse, with properties:
 *   - `start`: starting offset of the node in the document
 *   - `startTagEnd`: offset where the start tag ends
 *   - `tag`: tag name
 *   - `attributes`: map of attributes from the node
 *
 * @yields Attr - Each attribute object with name, value, offsets, and ranges.
 *
 * @example
 * ```ts
 * import { parseNodeAttrs } from "./parseNodeAttrs";
 * import { TextDocument } from "vscode-html-languageservice";
 *
 * const doc = TextDocument.create(
 *   "example.html",
 *   "html",
 *   1,
 *   '<button disabled="true"></button>'
 * );
 * const node = {
 *   start: 0,
 *   startTagEnd: 22,
 *   tag: "button",
 *   attributes: { disabled: 'true' }
 * };
 *
 * for (const attr of parseNodeAttrs(doc, node)) {
 *   console.log(attr.name, attr.value, attr.range);
 * }
 * // Output: "disabled", "true", Range covering the value
 * ```
 */
export function* parseNodeAttrs(
  textDoc: TextDocument,
  { start, startTagEnd, tag, attributes }: Node
): Generator<Attr> {
  if (!startTagEnd || !tag || !attributes) {
    return;
  }

  const text = textDoc.getText();
  const scanner = service.createScanner(text, start);
  let tokenEnd = -1;
  let token, name, nameOffset, tokenOffset, tokenText, head, tail, offset, end;

  while (tokenEnd < startTagEnd && (token = scanner.scan()) !== TokenType.EOS) {
    tokenEnd = scanner.getTokenEnd();
    if (token === TokenType.AttributeName) {
      name = scanner.getTokenText();
      nameOffset = scanner.getTokenOffset();
    } else if (
      name != null &&
      nameOffset != null &&
      token === TokenType.AttributeValue
    ) {
      tokenOffset = scanner.getTokenOffset();
      tokenText = scanner.getTokenText();
      head = HEAD_PATTERN.exec(tokenText)![0].length;
      tail = TAIL_PATTERN.exec(tokenText)![0].length * -1;
      offset = tokenOffset + head;
      end = tokenEnd + tail;

      yield {
        name,
        value: tokenText.slice(head, tail),
        offset,
        end,
        range: new Range(
          convertPosition(textDoc.positionAt(offset)),
          convertPosition(textDoc.positionAt(end))
        ),
        fullRange: new Range(
          convertPosition(textDoc.positionAt(nameOffset)),
          convertPosition(textDoc.positionAt(tokenEnd))
        ),
      };
      name = undefined;
    }
  }
}
