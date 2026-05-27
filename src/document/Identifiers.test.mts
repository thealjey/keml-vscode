import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  Diagnostic: class {
    constructor(
      public range: any,
      public message: any,
      public severity: any,
    ) {}
  },
  DiagnosticSeverity: { Warning: 0 },
  DiagnosticTag: { Unnecessary: "un" },
  CompletionItemKind: { Value: "val" },
  SymbolKind: { Constant: "const" },
  Range: class {
    constructor(
      public start: any,
      public end: any,
    ) {}
  },
  CompletionItem: class {
    constructor(
      public label: any,
      public kind: any,
    ) {}
  },
  MarkdownString: class {
    constructor(public message: any) {}
  },
  Hover: class {
    constructor(
      public message: any,
      public range: any,
    ) {}
  },
  Location: class {
    constructor(
      public uri: any,
      public range: any,
    ) {}
  },
  WorkspaceEdit: class extends Map<string, any> {
    replace(uri: string, range: any, name: string) {
      this.set(uri, { range, name });
    }
  },
  DocumentHighlight: class {
    constructor(public range: any) {}
  },
  DocumentSymbol: class {
    constructor(
      public name: any,
      public sm: any,
      public kind: any,
      public range: any,
      public range2: any,
    ) {}
  },
}));

vi.mock("../action/actions.mts", () => ({
  actions: [
    {
      name: "aaa",
      isOutput: (value: string) => value === "foo",
      isInput: (value: string) => value === "bar",
    },
    {
      name: "bbb",
      isOutput: (value: string) => value === "baz",
      isInput: (value: string) => value === "qaz",
    },
  ],
}));

vi.mock("../action/findAction.mts", () => ({
  findAction: vi.fn(),
}));

vi.mock("../action/provideActionValues.mts", () => ({
  TOKEN_TPL: vi.fn().mockReturnValue("token tpl"),
}));

vi.mock("../util/combineIterators.mts", () => ({
  combineIterators: (a: any, b: any) => [...Array.from(a), ...Array.from(b)],
}));

vi.mock("../util/t.mts", () => {
  const tpl = vi.fn().mockReturnValue("tpl");
  return { t: () => tpl };
});

vi.mock("./data.mts", () => ({
  config: {},
  diagnosticCollection: new Map(),
  documents: new Set([
    {
      uri: "doc uri",
      identifiers: {
        registry: new Map([
          [
            actions[0],
            {
              definitions: new Map([["uio", ["rfv"]]]),
              references: new Map([["jkl", []]]),
            },
          ],
        ]),
      },
    },
  ]),
}));

vi.mock("./isValidToken.mts", () => ({
  isValidToken: (value: string) => value === "foo",
}));

vi.mock("./parseTokens.mts", () => ({
  parseTokens: vi.fn().mockReturnValue([
    { token: "xcv", characterDelta: 5 },
    { token: "foo", characterDelta: 10 },
  ]),
}));

import { DiagnosticTag } from "vscode";
import { actions } from "../action/actions.mts";
import { findAction } from "../action/findAction.mts";
import { t } from "../util/t.mts";
import { config, diagnosticCollection, documents } from "./data.mts";
import { Identifiers } from "./Identifiers.mts";
import { parseTokens } from "./parseTokens.mts";

let ids: Identifiers;

describe("Identifiers", () => {
  beforeEach(() => {
    ids = new Identifiers({} as any);
    vi.clearAllMocks();
    vi.mocked(findAction)
      .mockReset()
      .mockReturnValueOnce(undefined)
      .mockReturnValue(actions[0]);
    config.UNUSED = undefined;
    config.UNRESOLVED = undefined;
    diagnosticCollection.clear();
    ids.document.tokenAtPosition = vi
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ range: { start: "st", end: "nd" }, token: "lol" })
      .mockReturnValue({ range: { start: "st", end: "nd" }, token: "uio" });
  });

  it("associate - no range", () => {
    ids.addTokenRanges = vi.fn();
    ids.associate({ name: "foo", value: "bar" } as any);
    expect(ids.addTokenRanges).not.toHaveBeenCalled();
  });

  it("associate - output", () => {
    ids.addTokenRanges = vi.fn();
    ids.associate({ name: "foo", value: "bar", range: 5 } as any);
    expect(ids.addTokenRanges).toHaveBeenCalledWith(
      expect.objectContaining(new Map()),
      "bar",
      5,
    );
  });

  it("associate - input", () => {
    ids.addTokenRanges = vi.fn();
    ids.associate({ name: "qaz", value: "bar", range: 5 } as any);
    expect(ids.addTokenRanges).toHaveBeenCalledWith(
      expect.objectContaining(new Map()),
      "bar",
      5,
    );
  });

  it("addTokenRanges", () => {
    const withR = vi.fn().mockReturnValue("with");
    const translate = vi
      .fn()
      .mockReturnValueOnce("start")
      .mockReturnValue("end");
    const store = new Map();
    ids.addTokenRanges(store, "foo", {
      with: withR,
      start: { translate },
    } as any);
    expect(parseTokens).toHaveBeenCalledWith("foo");
    expect(withR).toHaveBeenCalledWith(
      expect.objectContaining({ start: "start", end: "end" }),
    );
    expect(translate).toHaveBeenCalledWith(
      expect.objectContaining({ characterDelta: 10 }),
    );
    expect(translate).toHaveBeenCalledWith(
      expect.objectContaining({ characterDelta: 13 }),
    );
    expect(Array.from(store.entries())).toMatchObject([["foo", ["with"]]]);
  });

  it("resolve - no identifiers", () => {
    ids.addDiagnostics = vi.fn();
    ids.document.uri = "lol" as any;
    ids.document.diagnostics = { data: ["foo"] } as any;
    ids.resolve();
    expect(diagnosticCollection.get("lol" as any)).toMatchObject(["foo"]);
    expect(ids.addDiagnostics).not.toHaveBeenCalled();
  });

  it("resolve - identifiers", () => {
    ids.addDiagnostics = vi.fn((_a: any, b: any, c: any[]) => c.push(b));
    ids.document.uri = "lol" as any;
    ids.document.diagnostics = { data: ["foo"] } as any;
    config.UNUSED = 0;
    config.UNRESOLVED = 1;
    ids.resolve();
    expect(diagnosticCollection.get("lol" as any)).toMatchObject([0, 1, "foo"]);
    expect(ids.addDiagnostics).toHaveBeenCalledWith("definitions", 0, [0, 1]);
    expect(ids.addDiagnostics).toHaveBeenCalledWith("references", 1, [0, 1]);
  });

  it("findDocument", () => {
    const doc = Array.from(documents.values())[0]!;
    doc.identifiers.registry
      .get(actions[0]!)
      ?.references.set("foo", ["bar" as any]);
    expect(ids.findDocument(actions[0]!, "definitions", "foo")).toBeUndefined();
    expect(ids.findDocument(actions[0]!, "references", "foo")).toBe(doc);
  });

  it("addDiagnostics - definitions", () => {
    ids.findDocument = vi.fn().mockReturnValueOnce("foo").mockReturnValue(null);
    ids.registry = new Map([
      [
        { name: "foo" },
        {
          definitions: new Map([
            [42, [43, 44]],
            [45, [46, 47]],
          ]),
        },
      ] as any,
    ]);
    const arr: any[] = [];
    ids.addDiagnostics("definitions", 0, arr);
    expect(ids.findDocument).toHaveBeenCalledWith(
      { name: "foo" },
      "references",
      42,
    );
    expect(ids.findDocument).toHaveBeenCalledWith(
      { name: "foo" },
      "references",
      45,
    );
    expect((t as any)()).toHaveBeenCalledWith(
      expect.objectContaining({ name: "foo", token: 45 }),
    );
    expect(arr).toMatchObject([
      {
        range: 46,
        message: "tpl",
        severity: 0,
        tags: [DiagnosticTag.Unnecessary],
      },
      {
        range: 47,
        message: "tpl",
        severity: 0,
        tags: [DiagnosticTag.Unnecessary],
      },
    ]);
  });

  it("addDiagnostics - references", () => {
    ids.findDocument = vi.fn().mockReturnValueOnce("foo").mockReturnValue(null);
    ids.registry = new Map([
      [
        { name: "foo" },
        {
          references: new Map([
            [42, [43, 44]],
            [45, [46, 47]],
          ]),
        },
      ] as any,
    ]);
    const arr: any[] = [];
    ids.addDiagnostics("references", 1, arr);
    expect(ids.findDocument).toHaveBeenCalledWith(
      { name: "foo" },
      "definitions",
      42,
    );
    expect(ids.findDocument).toHaveBeenCalledWith(
      { name: "foo" },
      "definitions",
      45,
    );
    expect((t as any)()).toHaveBeenCalledWith(
      expect.objectContaining({ name: "foo", token: 45 }),
    );
    expect(arr).toMatchObject([
      { range: 46, message: "tpl", severity: 1 },
      { range: 47, message: "tpl", severity: 1 },
    ]);
  });

  it("provideCompletionItems", () => {
    const comp: any[] = [];
    expect(
      ids.provideCompletionItems({ name: "foo" } as any, "pos" as any, comp)
        .length,
    ).toBe(0);
    comp.push({ label: "uio" }, { label: { label: "jkl" } }, { label: "bnm" });
    expect(
      ids.provideCompletionItems({ name: "foo" } as any, "pos" as any, comp),
    ).toMatchObject([
      { label: "uio" },
      { label: { label: "jkl" } },
      { label: "bnm" },
      {
        documentation: { message: "token tpl" },
        insertText: "foo",
        kind: "val",
        label: "foo",
        preselect: true,
        range: { end: "pos", start: "pos" },
      },
    ]);
  });

  it("provideHover", () => {
    expect(
      ids.provideHover({ name: "foo" } as any, "pos" as any),
    ).toBeUndefined();
    expect(
      ids.provideHover({ name: "foo" } as any, "pos" as any),
    ).toMatchObject({
      message: { message: "token tpl" },
      range: { end: "nd", start: "st" },
    });
  });

  it("getLocations", () => {
    expect(
      ids.getLocations({ name: "foo" } as any, "bar", "definitions"),
    ).toBeUndefined();
    expect(
      ids.getLocations({ name: "foo" } as any, "uio", "definitions"),
    ).toMatchObject([{ range: "rfv", uri: "doc uri" }]);
    expect(
      ids.getLocations({ name: "foo" } as any, "bnm", "references"),
    ).toMatchObject([]);
  });

  it("provideRenameEdits", () => {
    expect(
      ids.provideRenameEdits({ name: "foo" } as any, "pos" as any, "name"),
    ).toBeUndefined();
    expect(
      Array.from(
        ids
          .provideRenameEdits({ name: "foo" } as any, "uio" as any, "name")!
          .entries(),
      ),
    ).toMatchObject([]);
    expect(
      Array.from(
        ids
          .provideRenameEdits({ name: "foo" } as any, "uio" as any, "name")!
          .entries(),
      ),
    ).toMatchObject([["doc uri", { name: "name", range: "rfv" }]]);
  });

  it("provideDocumentHighlights", () => {
    expect(
      ids.provideDocumentHighlights({ name: "foo" } as any, "pos" as any),
    ).toBeUndefined();
    ids.registry.get(actions[0]!)!.definitions.set("uio", "foobar" as any);
    expect(
      ids.provideDocumentHighlights({ name: "foo" } as any, "pos" as any),
    ).toMatchObject([]);
    expect(
      ids.provideDocumentHighlights({ name: "foo" } as any, "pos" as any),
    ).toMatchObject([
      { range: "f" },
      { range: "o" },
      { range: "o" },
      { range: "b" },
      { range: "a" },
      { range: "r" },
    ]);
  });

  it("provideDocumentSymbols", () => {
    ids.registry.get(actions[0]!)!.definitions.set("uio", "foobar" as any);
    expect(ids.provideDocumentSymbols()).toMatchObject([
      { kind: "const", name: "uio", range: "f", range2: "f", sm: "" },
      { kind: "const", name: "uio", range: "o", range2: "o", sm: "" },
      { kind: "const", name: "uio", range: "o", range2: "o", sm: "" },
      { kind: "const", name: "uio", range: "b", range2: "b", sm: "" },
      { kind: "const", name: "uio", range: "a", range2: "a", sm: "" },
      { kind: "const", name: "uio", range: "r", range2: "r", sm: "" },
    ]);
  });
});
