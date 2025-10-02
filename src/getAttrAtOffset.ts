import { Node, TextDocument } from "vscode-html-languageservice";
import { parseNodeAttrs } from "./parseNodeAttrs";

/**
 * Returns the attribute of an HTML node that contains a given document offset.
 *
 * Iterates over all attributes of the node and checks if the provided offset
 * falls within the range of any attribute's value. Returns the first matching
 * attribute, or `undefined` if no attribute contains the offset.
 *
 * @param textDoc - The text document containing the HTML content.
 * @param node - The HTML node to search.
 * @param offset - The zero-based document offset to check.
 *
 * @returns The {@link Attr} object containing the offset, or `undefined` if none found.
 *
 * @example
 * ```ts
 * import { getAttrAtOffset } from "./getAttrAtOffset";
 * import { TextDocument } from "vscode-html-languageservice";
 * import { parseNodeAttrs } from "./parseNodeAttrs";
 *
 * const doc = TextDocument.create(
 *   "example.html",
 *   "html",
 *   1,
 *   '<input type="text" value="Hello">'
 * );
 * const node = {
 *   start: 0,
 *   startTagEnd: 26,
 *   tag: "input",
 *   attributes: { type: "text", value: "Hello" }
 * };
 * const attr = getAttrAtOffset(
 *   doc,
 *   node,
 *   15
 * ); // Offset within the value of "type"
 *
 * console.log(attr.name); // "type"
 * console.log(attr.value); // "text"
 * ```
 */
export const getAttrAtOffset = (
  textDoc: TextDocument,
  node: Node,
  offset: number
) => {
  for (const attribute of parseNodeAttrs(textDoc, node)) {
    if (offset >= attribute.offset && offset <= attribute.end) {
      return attribute;
    }
  }
  return;
};
