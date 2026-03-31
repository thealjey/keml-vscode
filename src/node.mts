import { Node as LSNode } from "vscode-html-languageservice";

/**
 * Represents a parsed node with positional and attribute data.
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
  attributes = new Map<string, Attr>();

  /**
   * Creates a new node instance.
   *
   * @param param0 Source node data.
   */
  constructor({ tag, start, startTagEnd, end, endTagStart }: LSNode) {
    this.tag = tag;
    this.start = start;
    this.startTagEnd = startTagEnd;
    this.end = end;
    this.endTagStart = endTagStart;
  }

  /**
   * Sets an attribute on the node.
   *
   * @param name Attribute name.
   * @param attr Attribute value.
   * @returns This instance for chaining.
   */
  setAttribute(name: string, attr: Attr) {
    this.attributes.set(name, attr);
    return this;
  }

  /**
   * Retrieves an attribute by name.
   *
   * @param name Attribute name.
   * @returns The attribute value, or undefined if not present.
   */
  getAttribute(name: string) {
    return this.attributes.get(name);
  }

  /**
   * Checks whether an attribute exists.
   *
   * @param name Attribute name.
   * @returns True if the attribute is present.
   */
  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  /**
   * Finds an attribute located at a specific position.
   * This only searches inside of the attribute value, so valueless attribute
   * will never be found, which for the purposes of this function is expected.
   *
   * @param offset Character offset to test.
   * @returns The matching attribute, or undefined if none found.
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
    return;
  }
}

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("Node", () => {
    it("constructs correctly from LSNode", () => {
      const src = {
        tag: "div",
        start: 1,
        startTagEnd: 2,
        end: 3,
        endTagStart: 4,
      } as any;

      const node = new Node(src);

      expect(node.tag).toBe("div");
      expect(node.start).toBe(1);
      expect(node.startTagEnd).toBe(2);
      expect(node.end).toBe(3);
      expect(node.endTagStart).toBe(4);
      expect(node.attributes).toBeInstanceOf(Map);
    });

    it("setAttribute adds attribute and returns itself", () => {
      const node = new Node({ tag: "div", start: 0, end: 0 } as any);
      const attr = { start: 1, end: 2 } as any;

      const result = node.setAttribute("foo", attr);

      expect(result).toBe(node);
      expect(node.attributes.get("foo")).toBe(attr);
    });

    it("getAttribute retrieves stored attribute", () => {
      const node = new Node({ tag: "div", start: 0, end: 0 } as any);
      const attr = { start: 1, end: 2 } as any;
      node.attributes.set("foo", attr);

      expect(node.getAttribute("foo")).toBe(attr);
    });

    it("hasAttribute detects presence and absence", () => {
      const node = new Node({ tag: "div", start: 0, end: 0 } as any);
      node.attributes.set("bar", { start: 0, end: 1 } as any);

      expect(node.hasAttribute("bar")).toBe(true);
      expect(node.hasAttribute("baz")).toBe(false);
    });

    it("findAttrAt returns the attribute if offset is within range", () => {
      const node = new Node({ tag: "div", start: 0, end: 0 } as any);
      const attr = { start: 5, end: 10 } as any;
      node.attributes.set("foo", attr);

      const result = node.findAttrAt(7);

      expect(result).toBe(attr);
    });

    it("findAttrAt skips null and out-of-range attributes", () => {
      const node = new Node({ tag: "div", start: 0, end: 0 } as any);
      node.attributes.set("b", { start: 1, end: 2 } as any);

      expect(node.findAttrAt(0)).toBeUndefined();
      expect(node.findAttrAt(3)).toBeUndefined();
    });
  });
}
/* v8 ignore stop */
