import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class SnippetString {
    public value: string;

    public constructor(value: string) {
      this.value = value;
    }
  }

  class CompletionItem {
    public label: unknown;
    public kind: unknown;

    public preselect?: boolean;
    public tags?: unknown;
    public detail?: unknown;
    public documentation?: unknown;
    public insertText?: unknown;
    public range?: unknown;
    public additionalTextEdits?: unknown;
    public commitCharacters?: unknown;
    public keepWhitespace?: boolean;
    public command?: unknown;

    public constructor(label: unknown, kind?: unknown) {
      this.label = label;
      this.kind = kind;
    }
  }

  return {
    CompletionItem,
    SnippetString,
  };
});

vi.mock("vscode-html-languageservice", () => {
  const InsertTextFormat = {
    PlainText: 1,
    Snippet: 2,
  };

  const InsertTextMode = {
    asIs: 1,
    adjustIndentation: 2,
  };

  const TextEdit = {
    is: vi.fn(),
  };

  return {
    InsertTextFormat,
    InsertTextMode,
    TextEdit,
  };
});

vi.mock("./convertDocumentation.mts", () => ({
  convertDocumentation: vi.fn(),
}));

vi.mock("./convertRange.mts", () => ({
  convertRange: vi.fn(),
}));

vi.mock("./convertTextEdit.mts", () => ({
  convertTextEdit: vi.fn(),
}));

import { CompletionItem, SnippetString } from "vscode";

import {
  InsertTextFormat,
  InsertTextMode,
  TextEdit,
} from "vscode-html-languageservice";

import { convertDocumentation } from "./convertDocumentation.mts";
import { convertRange } from "./convertRange.mts";
import { convertTextEdit } from "./convertTextEdit.mts";

import { convertCompletionItem } from "./convertCompletionItem.mts";

describe("convertCompletionItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts a completion item with plain text insert text", () => {
    const convertedDocumentation = {
      value: "converted docs",
    };

    vi.mocked(convertDocumentation).mockReturnValue(
      convertedDocumentation as any,
    );

    const result = convertCompletionItem({
      label: "hello",
      kind: 123 as any,
      tags: [1],
      detail: "detail text",
      documentation: "docs",
      insertText: "insert text",
      insertTextFormat: InsertTextFormat.PlainText,
      commitCharacters: ["."],
      insertTextMode: InsertTextMode.asIs,
      command: {
        title: "Run",
        command: "run.command",
      },
    });

    expect(result).toBeInstanceOf(CompletionItem);

    expect(result.label).toBe("hello");
    expect(result.kind).toBe(123);

    expect(result.preselect).toBe(true);

    expect(result.tags).toEqual([1]);

    expect(result.detail).toBe("detail text");

    expect(convertDocumentation).toHaveBeenCalledTimes(1);

    expect(convertDocumentation).toHaveBeenCalledWith("docs");

    expect(result.documentation).toEqual(convertedDocumentation);

    expect(result.insertText).toBe("insert text");

    expect(result.commitCharacters).toEqual(["."]);

    expect(result.keepWhitespace).toBe(true);

    expect(result.command).toEqual({
      title: "Run",
      command: "run.command",
    });
  });

  it("converts snippet labels and text edits", () => {
    vi.mocked(TextEdit.is).mockReturnValue(true);

    vi.mocked(convertRange).mockReturnValue({
      start: "start",
      end: "end",
    } as any);

    vi.mocked(convertTextEdit).mockImplementation(
      value =>
        ({
          converted: value,
        }) as any,
    );

    const result = convertCompletionItem({
      label: "foo=${1:value}",
      kind: 456 as any,
      textEdit: {
        range: {
          start: {
            line: 1,
            character: 2,
          },
          end: {
            line: 3,
            character: 4,
          },
        },
        newText: "replacement",
      },
      additionalTextEdits: [
        {
          range: {
            start: {
              line: 5,
              character: 6,
            },
            end: {
              line: 7,
              character: 8,
            },
          },
          newText: "extra",
        },
      ],
    });

    expect(result).toBeInstanceOf(CompletionItem);

    expect(result.label).toBe("foo=value");

    expect(result.insertText).toBeInstanceOf(SnippetString);

    expect(result.insertText).toEqual({
      value: "foo=${1:value}",
    });

    expect(convertRange).toHaveBeenCalledTimes(1);

    expect(result.range).toEqual({
      start: "start",
      end: "end",
    });

    expect(convertTextEdit).toHaveBeenCalledTimes(1);

    expect(result.additionalTextEdits).toEqual([
      {
        converted: {
          range: {
            start: {
              line: 5,
              character: 6,
            },
            end: {
              line: 7,
              character: 8,
            },
          },
          newText: "extra",
        },
      },
    ]);
  });

  it("adds trigger suggest command for snippet insert text starting with label=", () => {
    const result = convertCompletionItem({
      label: "foo",
      kind: 999 as any,
      insertText: "foo=${1:value}",
      insertTextFormat: InsertTextFormat.Snippet,
    });

    expect(result.insertText).toBeInstanceOf(SnippetString);

    expect(result.command).toEqual({
      title: "Suggest",
      command: "editor.action.triggerSuggest",
    });
  });

  it("converts insert/replace text edits", () => {
    vi.mocked(TextEdit.is).mockReturnValue(false);

    vi.mocked(convertRange).mockImplementation(
      value =>
        ({
          converted: value,
        }) as any,
    );

    const result = convertCompletionItem({
      label: "item",
      kind: 789 as any,
      textEdit: {
        insert: {
          start: {
            line: 1,
            character: 1,
          },
          end: {
            line: 1,
            character: 1,
          },
        },
        replace: {
          start: {
            line: 1,
            character: 1,
          },
          end: {
            line: 1,
            character: 4,
          },
        },
        newText: "replace",
      },
      insertTextFormat: InsertTextFormat.PlainText,
    });

    expect(convertRange).toHaveBeenCalledTimes(2);

    expect(result.range).toEqual({
      inserting: {
        converted: {
          start: {
            line: 1,
            character: 1,
          },
          end: {
            line: 1,
            character: 1,
          },
        },
      },
      replacing: {
        converted: {
          start: {
            line: 1,
            character: 1,
          },
          end: {
            line: 1,
            character: 4,
          },
        },
      },
    });

    expect(result.insertText).toBe("replace");
  });

  it("creates a completion item using labelDetails when provided", () => {
    const result = convertCompletionItem({
      label: "myLabel",
      labelDetails: {
        description: "description",
        detail: "detail",
      },
      kind: 321 as any,
    });

    expect(result).toBeInstanceOf(CompletionItem);

    expect(result.label).toEqual({
      label: "myLabel",
      description: "description",
      detail: "detail",
    });

    expect(result.kind).toBe(321);
  });

  it("does not override insertText when insertText is provided (truthy insertText branch)", () => {
    const result = convertCompletionItem({
      label: "item",
      kind: 1,
      insertText: "already-set",
      insertTextFormat: InsertTextFormat.PlainText,
      textEdit: {
        range: {
          start: { line: 1, character: 1 },
          end: { line: 1, character: 2 },
        },
        newText: "from-edit",
      },
      textEditText: "from-edit-text",
    });

    expect(result.insertText).toBe("already-set");
  });

  it("falls back to textEdit.newText when insertText/textEditText/newText are all nullish (snippet branch)", () => {
    const result = convertCompletionItem({
      label: "item",
      kind: 1,
      textEdit: {
        range: {
          start: { line: 1, character: 1 },
          end: { line: 1, character: 2 },
        },
        newText: "fallback-value",
      },
      insertTextFormat: InsertTextFormat.Snippet,
    });

    expect(result.insertText).toBeInstanceOf(SnippetString);
    expect(result.insertText).toEqual({
      value: "fallback-value",
    });
  });
});
