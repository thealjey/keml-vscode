import { type Node as LSNode, TokenType } from "vscode-html-languageservice";

const HEAD_PATTERN = /^(?:\s*["'])?/;
const TAIL_PATTERN = /(?:["']\s*)?$/;

/**
 * Represents a parsed HTML-like node with positional information and
 * attributes.
 *
 * Provides access to tag metadata, source ranges, and attribute lookup
 * utilities.
 */
export class Node implements Omit<
  LSNode,
  "children" | "parent" | "attributes"
> {
  /**
   * Tag name of the node.
   */
  tag: string | undefined;

  /**
   * Start position of the node.
   */
  start: number;

  /**
   * End position of the start tag.
   */
  startTagEnd: number | undefined;

  /**
   * End position of the node.
   */
  end: number;

  /**
   * Start position of the end tag.
   */
  endTagStart: number | undefined;

  /**
   * Collection of node attributes.
   */
  readonly attributes = new Map<string, Attr>();

  constructor(
    public readonly document: Document,
    { tag, start, startTagEnd, end, endTagStart, attributes }: LSNode,
  ) {
    this.tag = tag;
    this.start = start;
    this.startTagEnd = startTagEnd;
    this.end = end;
    this.endTagStart = endTagStart;
    startTagEnd && attributes && tag && this.scan();
  }

  private scan() {
    const { start, startTagEnd } = this;
    const scanner = this.document.createScanner(start);
    let tokenEnd = -1,
      token,
      name,
      nameOffset,
      tokenOffset,
      tokenText,
      head,
      tail,
      offset,
      end;

    while (
      tokenEnd < startTagEnd! &&
      (token = scanner.scan()) !== TokenType.EOS
    ) {
      tokenEnd = scanner.getTokenEnd();
      if (token === TokenType.AttributeName) {
        name = scanner.getTokenText();
        nameOffset = scanner.getTokenOffset();

        this.setAttribute(name, {
          name,
          value: "",
          fullRange: this.document.rangeBetween(nameOffset, tokenEnd),
          node: this,
        });
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

        this.setAttribute(name, {
          name,
          value: tokenText.slice(head, tail),
          start: offset,
          end,
          range: this.document.rangeBetween(offset, end),
          fullRange: this.document.rangeBetween(nameOffset, tokenEnd),
          node: this,
        });
        name = undefined;
      }
    }
  }

  /**
   * Sets or replaces an attribute on the node.
   *
   * Returns the node for chaining.
   */
  setAttribute(name: string, attr: Attr) {
    this.attributes.set(name, attr);
    return this;
  }

  /**
   * Retrieves an attribute by name, if present.
   */
  getAttribute(name: string) {
    return this.attributes.get(name);
  }

  /**
   * Checks whether the node has an attribute with the given name.
   */
  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  /**
   * Finds an attribute that spans the given character offset, if any exists.
   */
  findAttrAt(offset: number) {
    for (const attr of this.attributes.values()) {
      if (
        "start" in attr &&
        "end" in attr &&
        offset >= attr.start &&
        offset <= attr.end
      ) {
        return attr;
      }
    }
  }
}
