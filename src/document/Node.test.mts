import { describe, expect, it, vi } from "vitest";
import { TokenType } from "vscode-html-languageservice";
import { Node } from "./Node.mts";

describe("Node", () => {
  it("simple input", () => {
    expect(
      new Node(null as any, {
        tag: undefined,
        start: 0,
        end: 1,
        endTagStart: 2,
        startTagEnd: undefined,
        children: [],
      }),
    ).toMatchObject({
      tag: undefined,
      start: 0,
      startTagEnd: undefined,
      end: 1,
      endTagStart: 2,
    });
  });

  it("scan - nothing to parse", () => {
    const createScanner = vi
      .fn()
      .mockReturnValue({ scan: () => TokenType.EOS });
    const node = new Node({ createScanner } as any, {
      tag: "foo",
      start: 0,
      end: 1,
      endTagStart: 2,
      startTagEnd: 3,
      children: [],
      attributes: {},
    });
    expect(node).toMatchObject({
      tag: "foo",
      start: 0,
      startTagEnd: 3,
      end: 1,
      endTagStart: 2,
    });
    expect(createScanner).toHaveBeenCalledWith(0);
    expect(node.attributes.size).toBe(0);
  });

  it("scan - nothing to parse", () => {
    const scan = vi
      .fn()
      .mockReturnValueOnce(TokenType.AttributeName)
      .mockReturnValueOnce(TokenType.AttributeValue)
      .mockReturnValueOnce(TokenType.AttributeValue)
      .mockReturnValue(TokenType.EOS);
    const getTokenText = vi
      .fn()
      .mockReturnValueOnce("foo")
      .mockReturnValue(' "bar"   ');
    const getTokenOffset = vi.fn().mockReturnValueOnce(42).mockReturnValue(43);
    const getTokenEnd = vi.fn().mockReturnValueOnce(0).mockReturnValue(1);
    const rangeBetween = vi
      .fn()
      .mockReturnValueOnce("qaz")
      .mockReturnValue("wsx");
    const node = new Node(
      {
        createScanner: () => ({
          scan,
          getTokenText,
          getTokenOffset,
          getTokenEnd,
        }),
        rangeBetween,
      } as any,
      {
        tag: "foo",
        start: 0,
        end: 1,
        endTagStart: 2,
        startTagEnd: 3,
        children: [],
        attributes: {},
      },
    );
    expect(Array.from(node.attributes.entries())).toMatchObject([
      ["foo", { fullRange: "wsx", name: "foo", value: "bar" }],
    ]);
    expect(node.attributes.get("foo")?.node).toBe(node);
  });

  it("setAttribute", () => {
    const node = new Node({} as any, {} as any);
    const attr = {} as Attr;
    expect(node.setAttribute("foo", attr)).toBe(node);
    expect(node.getAttribute("foo")).toBe(attr);
    expect(node.hasAttribute("foo")).toBeTruthy();
  });

  it("findAttrAt", () => {
    const node = new Node({} as any, {} as any);
    const attr1 = {} as Attr;
    const attr2 = { start: 5, end: 8 } as Attr;
    node.attributes.set("foo", attr1);
    node.attributes.set("bar", attr2);
    expect(node.findAttrAt(7)).toBe(attr2);
  });
});
