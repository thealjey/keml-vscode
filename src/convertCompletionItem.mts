import { CompletionItem, SnippetString } from "vscode";
import {
  InsertTextFormat,
  InsertTextMode,
  CompletionItem as LSCompletionItem,
  TextEdit,
} from "vscode-html-languageservice";
import { convertDocumentation } from "./convertDocumentation.mts";
import { convertRange } from "./convertRange.mts";
import { convertTextEdit } from "./convertTextEdit.mts";

/**
 * Converts a language service completion item into a VS Code-compatible
 * completion item.
 *
 * @param completionItem - Completion item from the language service.
 * @returns A completion item compatible with VS Code editors.
 */
export const convertCompletionItem = ({
  label,
  labelDetails,
  kind,
  tags,
  detail,
  documentation,
  insertText,
  insertTextFormat,
  insertTextMode,
  textEdit,
  textEditText,
  additionalTextEdits,
  commitCharacters,
  command,
}: LSCompletionItem) => {
  const item = new extern.CompletionItem(
    labelDetails ? { ...labelDetails, label } : label,
    kind
  );

  item.preselect = true;

  if (tags) {
    item.tags = tags;
  }

  if (detail) {
    item.detail = detail;
  }

  if (documentation) {
    item.documentation = extern.convertDocumentation(documentation);
  }

  if (insertText) {
    if (insertTextFormat === InsertTextFormat.PlainText) {
      item.insertText = insertText;
    } else {
      item.insertText = new extern.SnippetString(insertText);
    }
  }

  if (textEdit) {
    item.range = extern.TextEdit.is(textEdit)
      ? extern.convertRange(textEdit.range)
      : {
          inserting: extern.convertRange(textEdit.insert),
          replacing: extern.convertRange(textEdit.replace),
        };

    if (!insertText) {
      if (insertTextFormat === InsertTextFormat.PlainText) {
        item.insertText = textEditText ?? textEdit.newText;
      } else {
        item.insertText = new extern.SnippetString(
          textEditText ?? textEdit.newText
        );
      }
    }
  }

  if (additionalTextEdits) {
    item.additionalTextEdits = additionalTextEdits.map(extern.convertTextEdit);
  }

  if (commitCharacters) {
    item.commitCharacters = commitCharacters;
  }

  if (insertTextMode === InsertTextMode.asIs) {
    item.keepWhitespace = true;
  }

  if (command) {
    item.command = command;
  } else if (
    item.insertText &&
    typeof item.insertText !== "string" &&
    item.insertText.value.startsWith(`${label}=`)
  ) {
    item.command = {
      title: "Suggest",
      command: "editor.action.triggerSuggest",
    };
  }

  return item;
};

let extern = {
  CompletionItem,
  SnippetString,
  TextEdit,
  convertDocumentation,
  convertRange,
  convertTextEdit,
};

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("convertCompletionItem", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("converts a plain CompletionItem with plain text insertText", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn(function (this: any, val: string) {
        this.value = val;
      }) as any;
      extern.TextEdit = { is: fn().mockReturnValue(true) } as any;
      extern.convertDocumentation = fn().mockReturnValue("docConverted");
      extern.convertRange = fn().mockReturnValue({ converted: true });
      const mockConvertTextEdit = (extern.convertTextEdit =
        fn().mockReturnValue("convertedEdit"));

      const textEditMock = { newText: "edit", range: { start: 0, end: 1 } };

      const item = convertCompletionItem({
        label: "label1",
        labelDetails: { detail: "labelDetail" },
        kind: 1,
        tags: [1],
        detail: "detailVal",
        documentation: "docRaw",
        insertText: "plainText",
        insertTextFormat: InsertTextFormat.PlainText,
        insertTextMode: InsertTextMode.adjustIndentation,
        textEdit: textEditMock,
        textEditText: "editTextOverride",
        additionalTextEdits: [textEditMock],
        commitCharacters: ["a", "b"],
        command: undefined,
      } as any);

      expect(item).toMatchObject({
        label: { ...{ detail: "labelDetail" }, label: "label1" },
        preselect: true,
        tags: [1],
        detail: "detailVal",
        documentation: "docConverted",
        insertText: "plainText",
        range: { converted: true },
        additionalTextEdits: ["convertedEdit"],
        commitCharacters: ["a", "b"],
      });

      expect(extern.convertDocumentation).toHaveBeenCalledWith("docRaw");
      expect(extern.convertRange).toHaveBeenCalledWith(textEditMock.range);
      expect(mockConvertTextEdit.mock.calls[0]![0]).toBe(textEditMock);
    });

    it("wraps insertText in SnippetString if format is not PlainText and sets keepWhitespace", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn(function (this: any, val: string) {
        this.value = val;
      }) as any;
      extern.TextEdit = { is: fn() } as any;
      extern.convertDocumentation = fn();
      extern.convertRange = fn();
      extern.convertTextEdit = fn();

      const item = convertCompletionItem({
        label: "lbl",
        kind: 1,
        insertText: "snippetText",
        insertTextFormat: InsertTextFormat.Snippet,
        insertTextMode: InsertTextMode.asIs,
      } as any);

      expect(item).toMatchObject({
        insertText: { value: "snippetText" },
        keepWhitespace: true,
      });
    });

    it("sets command if insertText starts with label=", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn(function (this: any, val: string) {
        this.value = val;
      }) as any;
      extern.TextEdit = { is: fn() } as any;
      extern.convertDocumentation = fn();
      extern.convertRange = fn();
      extern.convertTextEdit = fn();

      const item = convertCompletionItem({
        label: "lbl",
        kind: 1,
        insertText: "lbl=someValue",
        insertTextFormat: InsertTextFormat.Snippet,
      } as any);

      expect(item.command).toMatchObject({
        title: "Suggest",
        command: "editor.action.triggerSuggest",
      });
    });

    it("handles textEdit object with insert/replace ranges and overrides insertText", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn(function (this: any, val: string) {
        this.value = val;
      }) as any;
      extern.TextEdit = { is: fn().mockReturnValue(false) } as any;
      extern.convertDocumentation = fn();
      const mockConvertRange = (extern.convertRange = fn().mockImplementation(
        r => ({ converted: r })
      ));
      extern.convertTextEdit = fn();

      const textEditObj = { insert: "ins", replace: "rep", newText: "ins" };

      const item = convertCompletionItem({
        label: "lbl",
        kind: 1,
        textEdit: textEditObj,
        insertTextFormat: InsertTextFormat.Snippet,
      } as any);

      expect(item.range).toMatchObject({
        inserting: { converted: "ins" },
        replacing: { converted: "rep" },
      });
      expect((item.insertText as any).value).toBe("ins");
      expect(mockConvertRange).toHaveBeenCalledTimes(2);
    });

    it("uses newText when insertTextFormat is PlainText", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn(function (this: any, val: string) {
        this.value = val;
      }) as any;
      extern.TextEdit = { is: fn().mockReturnValue(true) } as any;
      extern.convertDocumentation = fn();
      const mockConvertRange = (extern.convertRange = fn().mockReturnValue({
        converted: true,
      }));
      extern.convertTextEdit = fn();

      const textEditObj = {
        newText: "originalText",
        range: { start: 0, end: 1 },
      };

      const item = convertCompletionItem({
        label: "lbl",
        kind: 1,
        textEdit: textEditObj,
        insertTextFormat: InsertTextFormat.PlainText,
      } as any);

      expect(item.insertText).toBe("originalText");
      expect(mockConvertRange).toHaveBeenCalledWith(textEditObj.range);
    });

    it("uses textEditText when provided and insertTextFormat is PlainText", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn(function (this: any, val: string) {
        this.value = val;
      }) as any;
      extern.TextEdit = { is: fn().mockReturnValue(true) } as any;
      extern.convertDocumentation = fn();
      const mockConvertRange = (extern.convertRange = fn().mockReturnValue({
        converted: true,
      }));
      extern.convertTextEdit = fn();

      const textEditObj = { newText: "ignored", range: { start: 0, end: 1 } };

      const item = convertCompletionItem({
        label: "lbl",
        kind: 1,
        textEdit: textEditObj,
        textEditText: "overrideText",
        insertTextFormat: InsertTextFormat.PlainText,
      } as any);

      expect(item.insertText).toBe("overrideText");
      expect(mockConvertRange).toHaveBeenCalledWith(textEditObj.range);
    });

    it("assigns provided command instead of computing one", () => {
      extern.CompletionItem = class {
        constructor(public label: any, public kind: any) {}
      };
      extern.SnippetString = fn();
      extern.TextEdit = { is: fn() } as any;
      extern.convertDocumentation = fn();
      extern.convertRange = fn();
      extern.convertTextEdit = fn();

      const customCommand = { title: "Custom", command: "custom.cmd" };

      const item = convertCompletionItem({
        label: "lbl",
        kind: 1,
        command: customCommand,
      } as any);

      expect(item.command).toBe(customCommand);
    });
  });
}
/* v8 ignore stop */
