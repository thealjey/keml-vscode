import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  Diagnostic: class {
    constructor(
      public range: any,
      public message: any,
      public severity: any,
    ) {}
  },
  DiagnosticSeverity: { Warning: "warn", Error: "err" },
  DiagnosticTag: { Unnecessary: "un" },
}));

vi.mock("../document/isInvalidToken.mts", () => ({
  isInvalidToken: (value: string) => value === "foo",
}));

vi.mock("../document/parseTokens.mts", () => ({
  INVALID_PATTERN: /^ $/,
}));

vi.mock("../util/t.mts", () => {
  const tpl = vi.fn(() => "tpl");
  return { t: () => tpl };
});

import { t } from "../util/t.mts";
import { Action } from "./Action.mts";

let action: Action;

describe("actions", () => {
  beforeEach(() => {
    action = new Action();
    action.baseName = (value: string) => value.slice(1);
    action.combinedBaseName = (value: string) => value.slice(2);
    action.prefixes = ["a"];
    action.combinedPrefixes = ["a", "b"];
    vi.clearAllMocks();
  });

  it("provideAttributes", () => {
    expect(action.provideAttributes(null as any)).toEqual([]);
  });

  it("provideDiagnostics - input, no value", () => {
    action.isInput = () => true;
    action.rejectAttribute = () => undefined;
    expect(
      action.provideDiagnostics({ name: "foo", fullRange: "qaz" } as any),
    ).toMatchObject([
      { range: "qaz", message: "No action specified.", severity: "warn" },
    ]);
  });

  it("provideDiagnostics - input, no value", () => {
    action.isInput = () => true;
    action.rejectAttribute = () => undefined;
    expect(
      action.provideDiagnostics({
        name: "bar",
        value: "foo",
        range: "qaz",
      } as any),
    ).toMatchObject([{ range: "qaz", severity: "err" }]);
  });

  it("provideDiagnostics - input, no range", () => {
    action.isInput = () => true;
    action.rejectAttribute = () => undefined;
    expect(
      action.provideDiagnostics({ name: "bar", value: "foo" } as any).length,
    ).toBe(0);
  });

  it("provideDiagnostics - dependency", () => {
    action.rejectAttribute = () => [/./, /./];
    expect(
      action.provideDiagnostics({
        name: "foo",
        node: "bar",
        fullRange: "baz",
      } as any),
    ).toMatchObject([
      { range: "baz", message: "tpl", severity: "warn", tags: ["un"] },
    ]);
    expect((t as any)()).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "oo",
        depends: ["o"],
        prefixes: ["a", "b"],
      }),
    );
  });

  it("provideDiagnostics - dependency, end", () => {
    action.rejectAttribute = () => [/.$/, /./];
    expect(
      action.provideDiagnostics({
        name: "foo",
        node: "bar",
        fullRange: "baz",
      } as any),
    ).toMatchObject([
      { range: "baz", message: "tpl", severity: "warn", tags: ["un"] },
    ]);
  });

  it("provideDiagnostics - dependency, end, start", () => {
    action.rejectAttribute = () => [/^(.)$/, /./];
    expect(
      action.provideDiagnostics({
        name: "foo",
        node: "bar",
        fullRange: "baz",
      } as any),
    ).toMatchObject([
      { range: "baz", message: "tpl", severity: "warn", tags: ["un"] },
    ]);
  });

  it("provideDiagnostics - dependency, tags", () => {
    action.rejectAttribute = () => [/./, /./];
    action.tags = [["o", /./]];
    expect(
      action.provideDiagnostics({
        name: "foo",
        node: { tag: "g" },
        fullRange: "baz",
      } as any).length,
    ).toBe(0);
  });

  it("provideDiagnostics - options, ignore", () => {
    action.rejectAttribute = () => undefined;
    action.options = [
      [/^foo$/, /^baz$/, "hello", ["hola"]],
      [/^lol$/, /^baz$/, "hello", ["hola"]],
    ];
    expect(
      action.provideDiagnostics({
        name: "foo",
        value: "bar",
        range: "qaz",
        fullRange: "wsx",
      } as any),
    ).toMatchObject([{ range: "qaz", message: "tpl", severity: "err" }]);
    expect((t as any)()).toHaveBeenCalledWith(
      expect.objectContaining({ label: "hello", options: ["hola"] }),
    );
  });

  it("provideDiagnostics - options, fallback", () => {
    action.rejectAttribute = () => undefined;
    action.options = [[/^foo$/, /^baz$/, "hello", ["hola"], 42]];
    expect(
      action.provideDiagnostics({
        name: "foo",
        value: "bar",
        fullRange: "wsx",
      } as any),
    ).toMatchObject([{ range: "wsx", message: "tpl", severity: "warn" }]);
    expect((t as any)()).toHaveBeenCalledWith(
      expect.objectContaining({ fallback: 42 }),
    );
  });

  it("testParent", () => {
    expect(action.testParent("", "")).toBeFalsy();
  });

  it("rejectAttribute - no matching child", () => {
    action.output = [[/^o$/, [/^r$/]]];
    expect(
      action.rejectAttribute({ attributes: new Map() } as any, "foo"),
    ).toBeUndefined();
  });

  it("rejectAttribute - matches expression", () => {
    action.input = [[/^r$/, [/^o$/]]];
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
      ),
    ).toBeUndefined();
  });

  it("rejectAttribute - manual check", () => {
    action.other = [[/^o$/, [/^o$/]]];
    action.testParent = (parent, child) => parent === "r" && child === "o";
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
      ),
    ).toBeUndefined();
  });

  it("rejectAttribute - not keep", () => {
    action.other = [[/^o$/, [/^o$/]]];
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
      ),
    ).toMatchObject([/^o$/, /^o$/]);
  });

  it("rejectAttribute - not suppress", () => {
    action.other = [[/^o$/, [/^o$/], true]];
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
      ),
    ).toBeUndefined();
  });

  it("rejectAttribute - suppress", () => {
    action.other = [[/^o$/, [/^o$/], true]];
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
        true,
      ),
    ).toMatchObject([/^o$/, /^o$/]);
  });

  it("checkName", () => {
    expect(action.checkName("foo", [[/^bar$/] as any])).toBeFalsy();
    expect(action.checkName("bar", [[/^bar$/] as any])).toBeTruthy();
  });

  it("isOutput", () => {
    action.output = [[/^ar$/]] as any;
    expect(action.isOutput("foo")).toBeFalsy();
    expect(action.isOutput("bar")).toBeTruthy();
  });

  it("isInput", () => {
    action.input = [[/^ar$/]] as any;
    expect(action.isInput("foo")).toBeFalsy();
    expect(action.isInput("bar")).toBeTruthy();
  });

  it("provideDiagnostics - compatibility", () => {
    action.rejectAttribute = () => [["not", /./], /./];
    expect(
      action.provideDiagnostics({
        name: "foo",
        node: "bar",
        fullRange: "baz",
      } as any),
    ).toMatchObject([
      { range: "baz", message: "tpl", severity: "warn", tags: ["un"] },
    ]);
    expect((t as any)()).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "oo",
        depends: ["o"],
        prefixes: ["a", "b"],
      }),
    );
  });

  it("rejectAttribute - not parent, matching attribute", () => {
    action.other = [[["not", /^r$/], [/^o$/]]];
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
      ),
    ).toMatchObject([["not", /^r$/], /^o$/]);
  });

  it("rejectAttribute - not parent, no matching attribute", () => {
    action.other = [[["not", /^r$/], [/^o$/]]];
    expect(
      action.rejectAttribute({ attributes: new Map() } as any, "foo"),
    ).toBeUndefined();
  });

  it("rejectAttribute - not parent, suppress", () => {
    action.other = [[["not", /^r$/], [/^o$/], true]];
    expect(
      action.rejectAttribute(
        { attributes: new Map([["bar", null]]) } as any,
        "foo",
        true,
      ),
    ).toMatchObject([["not", /^r$/], /^o$/]);
  });

  it("checkName - not pattern", () => {
    expect(action.checkName("foo", [[["not", /^bar$/]]] as any)).toBeFalsy();
    expect(action.checkName("bar", [[["not", /^bar$/]]] as any)).toBeTruthy();
  });
});
