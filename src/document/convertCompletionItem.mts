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
 * Transforms a language service completion item into a VSCode-compatible
 * completion item, including insert text, edits, and documentation formatting.
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
  const newLabel = label.replace(/\${(?:\d+:)?([^}]+)}/g, "$1");
  let newText;
  if (label !== newLabel) {
    newText = label;
    label = newLabel;
    insertTextFormat = InsertTextFormat.Snippet;
  }
  const item = new CompletionItem(
    labelDetails ? { ...labelDetails, label } : label,
    kind,
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
      item.insertText = new SnippetString(newText ?? insertText);
    }
  }

  if (textEdit) {
    item.range =
      TextEdit.is(textEdit) ?
        convertRange(textEdit.range)
      : {
          inserting: convertRange(textEdit.insert),
          replacing: convertRange(textEdit.replace),
        };

    if (!insertText) {
      if (insertTextFormat === InsertTextFormat.PlainText) {
        item.insertText = textEditText ?? textEdit.newText;
      } else {
        item.insertText = new SnippetString(
          newText ?? textEditText ?? textEdit.newText,
        );
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
