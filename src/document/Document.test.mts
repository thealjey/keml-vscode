import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  Range: class {
    constructor(
      public start: any,
      public end: any,
    ) {}
  },
}));

vi.mock("../action/data.mts", () => ({
  setNode: vi.fn(),
}));

vi.mock("../service/service.mts", () => ({
  service: {
    createScanner: vi.fn(() => "scanner"),
    doComplete: vi.fn(() => ({ items: ["completion"] })),
    doHover: vi.fn(
      (_a: any, { line, character }: { line: number; character: number }) =>
        line === 4 && character === 2 ? "hover" : null,
    ),
    parseHTMLDocument: vi.fn(() => ({ roots: [] })),
  },
}));

vi.mock("../util/sortByStart.mts", () => ({
  sortByStart: vi.fn(),
}));

vi.mock("./convertCompletionItem.mts", () => ({
  convertCompletionItem: vi.fn(() => ["converted completion"]),
}));

vi.mock("./convertHover.mts", () => ({
  convertHover: vi.fn(() => "converted hover"),
}));

vi.mock("./data.mts", () => ({
  matchLanguageId: vi.fn((value: string) => value === "language id"),
  matchUri: vi.fn(({ path }: { path: string }) => path === "path"),
}));

vi.mock("./Diagnostics.mts", () => ({
  Diagnostics: class {
    associate = vi.fn();
  },
}));

vi.mock("./Identifiers.mts", () => ({
  Identifiers: class {
    constructor(public doc: any) {}
    associate = vi.fn();
    provideCompletionItems = vi.fn(() => ["identifier completion"]);
    provideHover = vi.fn();
    getLocations = vi.fn();
    provideRenameEdits = vi.fn();
    provideDocumentHighlights = vi.fn();
    provideDocumentSymbols = vi.fn();
  },
}));

vi.mock("./Node.mts", () => ({
  Node: class {
    start: any;
    startTagEnd: any;
    constructor(
      public doc: any,
      { start, startTagEnd }: { start: any; startTagEnd: any },
    ) {
      this.start = start;
      this.startTagEnd = startTagEnd;
    }
  },
}));

vi.mock("./parseTokens.mts", () => ({
  parseTokens: vi.fn(() => [
    { token: "foo", characterDelta: 14 },
    { token: "bar", characterDelta: 17 },
    { token: "baz", characterDelta: 19 },
  ]),
}));

import { TextDocument as LSTextDocument } from "vscode-html-languageservice";
import { setNode } from "../action/data.mts";
import { service } from "../service/service.mts";
import { sortByStart } from "../util/sortByStart.mts";
import { Document } from "./Document.mts";
import { convertCompletionItem } from "./convertCompletionItem.mts";

let doc: Document;

describe("updateDiagnosticCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    doc = new Document({
      uri: { toString: () => "uri", path: "path" },
      languageId: "language id",
      version: "version",
      getText: vi.fn().mockReturnValue("text"),
      offsetAt: vi.fn(
        ({ line, character }: { line: number; character: number }) =>
          line * 10 + character,
      ),
      positionAt: vi.fn((offset: number) => ({
        line: (offset / 10) | 0,
        character: offset % 10,
      })),
    } as any);
  });

  it("url", () => {
    expect(doc.url).toBe("uri");
  });

  it("languageId", () => {
    expect(doc.languageId).toBe("language id");
  });

  it("version", () => {
    expect(doc.version).toBe("version");
  });

  it("text", () => {
    expect(doc.text).toBe("text");
  });

  it("getText", () => {
    expect(doc.getText("foo" as any)).toBe("text");
    expect(doc.doc.getText).toHaveBeenCalledWith("foo");
  });

  it("offsetAt", () => {
    const position = { line: 2, character: 4 } as any;
    expect(doc.offsetAt(position)).toBe(24);
    expect(doc.doc.offsetAt).toHaveBeenCalledWith(position);
  });

  it("positionAt", () => {
    expect(doc.positionAt(24)).toMatchObject({ line: 2, character: 4 });
    expect(doc.doc.positionAt).toHaveBeenCalledWith(24);
  });

  it("rangeBetween", () => {
    expect(doc.rangeBetween(42, 43)).toMatchObject({
      start: { line: 4, character: 2 },
      end: { line: 4, character: 3 },
    });
    expect(doc.doc.positionAt).toHaveBeenCalledWith(42);
    expect(doc.doc.positionAt).toHaveBeenCalledWith(43);
  });

  it("createScanner", () => {
    expect(doc.createScanner(42, "foo" as any)).toBe("scanner");
    expect(doc.doc.getText).toHaveBeenCalledWith("foo");
    expect(service.createScanner).toHaveBeenCalledWith("text", 42);
  });

  it("tokenAtPosition", () => {
    expect(
      doc.tokenAtPosition({ value: "foo" } as any, "foo" as any),
    ).toBeUndefined();
    expect(
      doc.tokenAtPosition(
        { value: "foo", range: { start: { line: 2, character: 4 } } } as any,
        { line: 4, character: 2 } as any,
      ),
    ).toMatchObject({
      token: "bar",
      range: {
        start: { line: 4, character: 1 },
        end: { line: 4, character: 4 },
      },
    });
  });

  it("nodeAt", () => {
    doc.nodes = [
      { start: 0 },
      { start: 1 },
      { start: 2 },
      { start: 3, startTagEnd: 3 },
      { start: 4 },
      { start: 5 },
      { start: 6 },
    ] as any;
    expect(doc.nodeAt(4)).toMatchObject({ start: 4 });
  });

  it("static isApplicable", () => {
    expect(Document.isApplicable("foo", { path: "path" } as any)).toBeFalsy();
    expect(
      Document.isApplicable("language id", { path: "foo" } as any),
    ).toBeFalsy();
    expect(
      Document.isApplicable("language id", { path: "path" } as any),
    ).toBeTruthy();
  });

  it("isApplicable", () => {
    const isApplicable = vi
      .spyOn(Document, "isApplicable")
      .mockReturnValue("foo" as any);
    // @ts-ignore
    doc.doc.languageId = "bar";
    doc.uri = { path: "baz" } as any;
    expect(doc.isApplicable()).toBe("foo");
    expect(isApplicable).toHaveBeenCalledWith("bar", doc.uri);
  });

  it("update", () => {
    doc.parse = vi.fn().mockReturnValue("parsed doc");
    doc.textDoc = "old doc" as any;
    const update = vi
      .spyOn(LSTextDocument, "update")
      .mockReturnValue("updated doc" as any);
    expect(
      doc.update({
        document: { version: 42, uri: "foo" },
        contentChanges: [],
      } as any),
    ).toBeUndefined();
    expect(update).not.toHaveBeenCalled();
    expect(doc.version).toBe(42);
    expect(doc.uri).toBe("foo");
    doc.update({
      document: { version: 42, uri: "foo" },
      contentChanges: ["baz"],
    } as any);
    expect(doc.textDoc).toBe("updated doc");
    expect(update).toHaveBeenCalledWith("old doc", ["baz"], 42);
    expect(doc.parse).toHaveBeenCalled();
  });

  it("provideCompletionItems", () => {
    doc.nodes = [
      { start: 42, findAttrAt: () => null },
      { start: 43, findAttrAt: () => "attr" },
    ] as any;
    expect(
      doc.provideCompletionItems({ line: 4, character: 1 } as any),
    ).toBeUndefined();
    expect(setNode).not.toHaveBeenCalled();
    expect(
      doc.provideCompletionItems({ line: 4, character: 2 } as any),
    ).toMatchObject(["converted completion"]);
    expect(setNode).toHaveBeenCalledWith(
      expect.objectContaining({ start: 42 }),
    );
    expect(convertCompletionItem).toHaveBeenCalledWith("completion", 0, [
      "completion",
    ]);
    expect(
      doc.provideCompletionItems({ line: 4, character: 3 } as any),
    ).toMatchObject(["identifier completion"]);
  });

  it("provideHover", () => {
    doc.nodes = [
      { start: 42 },
      { start: 43, findAttrAt: () => null },
      { start: 44, findAttrAt: () => "attr" },
    ] as any;
    const provideHover = vi
      .spyOn(doc.identifiers, "provideHover")
      .mockReturnValue("identifier hover" as any);
    expect(doc.provideHover({ line: 4, character: 1 } as any)).toBeUndefined();
    expect(setNode).not.toHaveBeenCalled();
    expect(doc.provideHover({ line: 4, character: 2 } as any)).toBe(
      "converted hover",
    );
    expect(setNode).toHaveBeenCalledWith(
      expect.objectContaining({ start: 42 }),
    );
    expect(doc.provideHover({ line: 4, character: 3 } as any)).toBeUndefined();
    expect(provideHover).not.toHaveBeenCalled();
    expect(doc.provideHover({ line: 4, character: 4 } as any)).toBe(
      "identifier hover",
    );
    expect(provideHover).toHaveBeenCalledWith("attr", {
      line: 4,
      character: 4,
    });
  });

  it("provideDefinition", () => {
    doc.nodes = [
      { start: 42, findAttrAt: () => null },
      { start: 43, findAttrAt: () => "attr" },
    ] as any;
    const getLocations = vi
      .spyOn(doc.identifiers, "getLocations")
      .mockReturnValue("identifier locations" as any);
    expect(
      doc.provideDefinition({ line: 4, character: 1 } as any),
    ).toBeUndefined();
    expect(setNode).not.toHaveBeenCalled();
    doc.tokenAtPosition = vi.fn().mockReturnValue(null);
    expect(
      doc.provideDefinition({ line: 4, character: 2 } as any),
    ).toBeUndefined();
    expect(setNode).toHaveBeenCalledWith(
      expect.objectContaining({ start: 42 }),
    );
    expect(doc.tokenAtPosition).not.toHaveBeenCalled();
    expect(
      doc.provideDefinition({ line: 4, character: 3 } as any),
    ).toBeUndefined();
    expect(doc.tokenAtPosition).toHaveBeenCalledWith("attr", {
      line: 4,
      character: 3,
    });
    expect(getLocations).not.toHaveBeenCalled();
    doc.tokenAtPosition = vi.fn().mockReturnValue({ token: "foo token" });
    expect(doc.provideDefinition({ line: 4, character: 3 } as any)).toBe(
      "identifier locations",
    );
    expect(getLocations).toHaveBeenCalledWith(
      "attr",
      "foo token",
      "definitions",
    );
  });

  it("provideReferences", () => {
    doc.nodes = [
      { start: 42, findAttrAt: () => null },
      { start: 43, findAttrAt: () => "attr" },
    ] as any;
    const getLocations = vi
      .spyOn(doc.identifiers, "getLocations")
      .mockImplementation((_a: any, _b: any, c: string) =>
        c === "references" ? (["identifier locations"] as any) : null,
      );
    expect(
      doc.provideReferences({ line: 4, character: 1 } as any, {
        includeDeclaration: false,
      }),
    ).toBeUndefined();
    expect(setNode).not.toHaveBeenCalled();
    doc.tokenAtPosition = vi.fn().mockReturnValue(null);
    expect(
      doc.provideReferences({ line: 4, character: 2 } as any, {
        includeDeclaration: false,
      }),
    ).toBeUndefined();
    expect(setNode).toHaveBeenCalledWith(
      expect.objectContaining({ start: 42 }),
    );
    expect(doc.tokenAtPosition).not.toHaveBeenCalled();
    expect(
      doc.provideReferences({ line: 4, character: 3 } as any, {
        includeDeclaration: false,
      }),
    ).toBeUndefined();
    expect(doc.tokenAtPosition).toHaveBeenCalledWith("attr", {
      line: 4,
      character: 3,
    });
    expect(getLocations).not.toHaveBeenCalled();
    doc.tokenAtPosition = vi.fn().mockReturnValue({ token: "foo token" });
    expect(
      doc.provideReferences({ line: 4, character: 3 } as any, {
        includeDeclaration: false,
      }),
    ).toMatchObject(["identifier locations"]);
    expect(getLocations).toHaveBeenCalledWith(
      "attr",
      "foo token",
      "references",
    );
    getLocations.mockClear();
    expect(
      doc.provideReferences({ line: 4, character: 3 } as any, {
        includeDeclaration: true,
      }),
    ).toMatchObject(["identifier locations"]);
    expect(getLocations).toHaveBeenCalledWith(
      "attr",
      "foo token",
      "references",
    );
    expect(getLocations).toHaveBeenCalledWith(
      "attr",
      "foo token",
      "definitions",
    );
  });

  it("prepareRename", () => {
    doc.nodes = [
      { start: 42, findAttrAt: () => null },
      { start: 43, findAttrAt: () => "attr" },
    ] as any;
    doc.tokenAtPosition = vi.fn().mockReturnValue(null);
    expect(() => doc.prepareRename({ line: 4, character: 2 } as any)).toThrow();
    expect(doc.tokenAtPosition).not.toHaveBeenCalled();
    expect(() => doc.prepareRename({ line: 4, character: 3 } as any)).toThrow();
    expect(doc.tokenAtPosition).toHaveBeenCalledWith("attr", {
      line: 4,
      character: 3,
    });
    doc.tokenAtPosition = vi
      .fn()
      .mockReturnValue({ token: "foo token", range: "foo range" });
    expect(doc.prepareRename({ line: 4, character: 3 } as any)).toMatchObject({
      placeholder: "foo token",
      range: "foo range",
    });
    expect(doc.tokenAtPosition).toHaveBeenCalledWith("attr", {
      line: 4,
      character: 3,
    });
  });

  it("provideRenameEdits", () => {
    doc.nodes = [
      { start: 42, findAttrAt: () => null },
      { start: 43, findAttrAt: () => "attr" },
    ] as any;
    const provideRenameEdits = vi
      .spyOn(doc.identifiers, "provideRenameEdits")
      .mockReturnValue("identifier edit" as any);
    expect(
      doc.provideRenameEdits({ line: 4, character: 2 } as any, "foo"),
    ).toBeUndefined();
    expect(
      doc.provideRenameEdits({ line: 4, character: 3 } as any, "foo"),
    ).toBe("identifier edit");
    expect(provideRenameEdits).toHaveBeenCalledWith(
      "attr",
      { line: 4, character: 3 },
      "foo",
    );
  });

  it("provideDocumentHighlights", () => {
    doc.nodes = [
      { start: 42, findAttrAt: () => null },
      { start: 43, findAttrAt: () => "attr" },
    ] as any;
    const provideDocumentHighlights = vi
      .spyOn(doc.identifiers, "provideDocumentHighlights")
      .mockReturnValue("identifier highlight" as any);
    expect(
      doc.provideDocumentHighlights({ line: 4, character: 2 } as any),
    ).toBeUndefined();
    expect(
      doc.provideDocumentHighlights({ line: 4, character: 3 } as any),
    ).toBe("identifier highlight");
    expect(provideDocumentHighlights).toHaveBeenCalledWith("attr", {
      line: 4,
      character: 3,
    });
  });

  it("provideDocumentSymbols", () => {
    const provideDocumentSymbols = vi
      .spyOn(doc.identifiers, "provideDocumentSymbols")
      .mockReturnValue("identifier symbols" as any);
    expect(doc.provideDocumentSymbols()).toBe("identifier symbols");
    expect(provideDocumentSymbols).toHaveBeenCalled();
  });

  it("parse", () => {
    doc.parseNode = vi.fn();
    vi.mocked(service.parseHTMLDocument).mockReturnValueOnce({
      roots: [{ start: 0, children: [{ start: 1 }, { start: 2 }] }],
    } as any);
    const sort = vi.spyOn(Array.prototype, "sort");
    doc.parse();
    expect(doc.parseNode).toHaveBeenCalledWith(
      expect.objectContaining({ doc, start: 0 }),
    );
    expect(doc.parseNode).toHaveBeenCalledWith(
      expect.objectContaining({ doc, start: 1 }),
    );
    expect(doc.parseNode).toHaveBeenCalledWith(
      expect.objectContaining({ doc, start: 2 }),
    );
    expect(sort).toHaveBeenCalledWith(sortByStart);
  });

  it("parseNode", () => {
    doc.nodes = [];
    doc.parseNode({ attributes: new Set(["foo", "bar"]) } as any);
    expect(doc.identifiers.associate).toHaveBeenCalledWith("foo");
    expect(doc.identifiers.associate).toHaveBeenCalledWith("bar");
    expect(doc.diagnostics.associate).toHaveBeenCalledWith("foo");
    expect(doc.diagnostics.associate).toHaveBeenCalledWith("bar");
  });
});
