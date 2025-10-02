import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticTag,
  Range,
  TextDocument,
} from "vscode";
import { TextDocument as LSTextDocument } from "vscode-html-languageservice";
import { addDefinitionRanges } from "./addDefinitionRanges";
import { addDependsDiagnostic } from "./addDependsDiagnostic";
import { addRange } from "./addRange";
import { isEventDefinition } from "./isEventDefinition";
import { isEventFilter } from "./isEventFilter";
import { isEventReference } from "./isEventReference";
import { isPosition } from "./isPosition";
import { isResultDefinition } from "./isResultDefinition";
import { isResultReference } from "./isResultReference";
import { isStateDefinition } from "./isStateDefinition";
import { isStateReference } from "./isStateReference";
import { isTagOnDependent } from "./isTagOnDependent";
import { parseNodeAttrs } from "./parseNodeAttrs";
import { INVALID_PATTERN } from "./parseTokens";
import { service } from "./service";

const END_SPACE_PATTERN = /(?:^\s|\s$)/;
const validPosition = [
  "replaceChildren",
  "replaceWith",
  "before",
  "after",
  "prepend",
  "append",
];

/**
 * Parses a given HTML document and extracts all relevant definitions,
 * references, and diagnostics for event, state, and result action.
 *
 * This function iteratively traverses the entire HTML AST of the document,
 * collecting:
 * - Action **definitions**.
 * - Action **references**.
 * - Diagnostics for invalid or missing actions, incorrect positions, and
 *   dependent attribute rules.
 *
 * @param doc - The VS Code `TextDocument` representing the HTML file.
 * @param textDoc - A `vscode-html-languageservice` `TextDocument` used to parse
 *                  and analyze the HTML content.
 *
 * @returns A `ParsedDocument` object.
 *
 * @example
 * ```ts
 * import { TextDocument } from "vscode";
 * import { parseHTMLDocument } from "./parseHTMLDocument";
 *
 * const doc: TextDocument = ...;
 * const textDoc = TextDocument.create(
 *   doc.uri.toString(),
 *   "html",
 *   doc.version,
 *   doc.getText()
 * );
 * const parsed = parseHTMLDocument(doc, textDoc);
 *
 * console.log(parsed.event_definitions);
 * console.log(parsed.diagnostics);
 * ```
 */
export const parseHTMLDocument = (
  doc: TextDocument,
  textDoc: LSTextDocument
): ParsedDocument => {
  const diagnostics: Diagnostic[] = [];
  const event_definitions = new Map<string, Range[]>();
  const event_references = new Map<string, Range[]>();
  const state_definitions = new Map<string, Range[]>();
  const state_references = new Map<string, Range[]>();
  const result_definitions = new Map<string, Range[]>();
  const result_references = new Map<string, Range[]>();
  const htmlDoc = service.parseHTMLDocument(textDoc);
  const stack = [htmlDoc.roots];
  let nodes, node, diagnostic, tag, attributes;

  while ((nodes = stack.pop())) {
    for (node of nodes) {
      stack.push(node.children);
      tag = node.tag;
      attributes = node.attributes ?? {};

      for (const { name, value, range, fullRange } of parseNodeAttrs(
        textDoc,
        node
      )) {
        if (isEventDefinition(name)) {
          addDefinitionRanges(event_definitions, value, range);
        } else if (isEventReference(name)) {
          addRange(event_references, value, range);
        } else if (isStateDefinition(name)) {
          addDefinitionRanges(state_definitions, value, range);
        } else if (isStateReference(name)) {
          addRange(state_references, value, range);
        } else if (isResultDefinition(name)) {
          addDefinitionRanges(result_definitions, value, range);
        } else if (isResultReference(name)) {
          addRange(result_references, value, range);
        }
        if (
          isEventReference(name) ||
          isStateReference(name) ||
          isResultReference(name)
        ) {
          if (!value) {
            diagnostic = new Diagnostic(
              fullRange,
              "No action specified.",
              DiagnosticSeverity.Warning
            );
            diagnostic.source = "KEML";
            diagnostic.tags = [DiagnosticTag.Unnecessary];
            diagnostics.push(diagnostic);
          } else if (END_SPACE_PATTERN.test(value)) {
            diagnostic = new Diagnostic(
              fullRange,
              "Action subscribers are only allowed to hold 1 value and are used verbatim.\nMake sure not to have any spaces in the action name.",
              DiagnosticSeverity.Error
            );
            diagnostic.source = "KEML";
            diagnostics.push(diagnostic);
          }
        }
        if (isEventFilter(name)) {
          addDependsDiagnostic(
            diagnostics,
            attributes,
            fullRange,
            name,
            `on${name.slice(name.indexOf(":"))}`,
            "a corresponding"
          );
        }
        if (isTagOnDependent(tag!, name)) {
          addDependsDiagnostic(
            diagnostics,
            attributes,
            fullRange,
            name,
            "on",
            "an"
          );
        }
        if (isPosition(name)) {
          addDependsDiagnostic(
            diagnostics,
            attributes,
            fullRange,
            name,
            "render"
          );
          if (!validPosition.includes(value) && !INVALID_PATTERN.test(value)) {
            diagnostic = new Diagnostic(
              fullRange,
              `Invalid render position specified.\nMust be one of: ${validPosition.join(
                ", "
              )}.`,
              DiagnosticSeverity.Error
            );
            diagnostic.source = "KEML";
            diagnostics.push(diagnostic);
          }
        }
        if (name.startsWith("x-")) {
          addDependsDiagnostic(
            diagnostics,
            attributes,
            fullRange,
            name,
            "if",
            "an"
          );
        }
      }
    }
  }

  return {
    doc,
    textDoc,
    htmlDoc,
    event_definitions,
    event_references,
    state_definitions,
    state_references,
    result_definitions,
    result_references,
    diagnostics,
  };
};
