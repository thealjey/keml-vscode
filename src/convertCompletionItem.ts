import { CompletionItem, SnippetString } from "vscode";
import {
  InsertTextFormat,
  InsertTextMode,
  CompletionItem as LSCompletionItem,
  TextEdit,
} from "vscode-html-languageservice";
import { convertDocumentation } from "./convertDocumentation";
import { convertRange } from "./convertRange";
import { convertTextEdit } from "./convertTextEdit";

/**
 * Converts a completion item from the HTML language service format to VSCode
 * format.
 *
 * This function maps properties from an {@link LSCompletionItem} to a
 * {@link CompletionItem}, handling documentation, text edits, insert text
 * formatting, snippet conversion, ranges, additional text edits, commit
 * characters, and command triggers.
 *
 * @param item - The completion item from the HTML language service.
 * @returns A VSCode {@link CompletionItem} with equivalent properties.
 *
 * @example
 * ```ts
 * import { CompletionItem } from "vscode";
 * import { convertCompletionItem } from "./convertCompletionItem";
 *
 * const lsItem = {
 *   label: "class",
 *   insertText: "class=\"\"",
 *   insertTextFormat: InsertTextFormat.Snippet,
 * };
 *
 * const vscodeItem: CompletionItem = convertCompletionItem(lsItem);
 * ```
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
  const item = new CompletionItem(
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
    item.documentation = convertDocumentation(documentation);
  }

  if (insertText) {
    if (insertTextFormat === InsertTextFormat.PlainText) {
      item.insertText = insertText;
    } else {
      item.insertText = new SnippetString(insertText);
    }
  }

  if (textEdit) {
    item.range = TextEdit.is(textEdit)
      ? convertRange(textEdit.range)
      : {
          inserting: convertRange(textEdit.insert),
          replacing: convertRange(textEdit.replace),
        };

    if (!insertText) {
      if (insertTextFormat === InsertTextFormat.PlainText) {
        item.insertText = textEditText ?? textEdit.newText;
      } else {
        item.insertText = new SnippetString(textEditText ?? textEdit.newText);
      }
    }
  }

  if (additionalTextEdits) {
    item.additionalTextEdits = additionalTextEdits.map(convertTextEdit);
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
