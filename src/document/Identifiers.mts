import {
  CompletionItem,
  CompletionItemKind,
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticTag,
  DocumentHighlight,
  DocumentSymbol,
  Hover,
  Location,
  MarkdownString,
  type Position,
  Range,
  SymbolKind,
  WorkspaceEdit,
} from "vscode";
import type { Action } from "../action/Action.mts";
import { actions } from "../action/actions.mts";
import { findAction } from "../action/findAction.mts";
import { TOKEN_TPL } from "../action/provideActionValues.mts";
import { combineIterators } from "../util/combineIterators.mts";
import { t } from "../util/t.mts";
import { config, diagnosticCollection, documents } from "./data.mts";
import { isValidToken } from "./isValidToken.mts";
import { parseTokens } from "./parseTokens.mts";

const template = {
  definitions: t`${"token"} ${"name|1"} action is declared but its value is never read.`,
  references: t`Cannot find ${"name|1"} action ${"token"}.`,
};

/**
 * Provides symbol indexing and resolution for document-level language features.
 *
 * Supports token tracking, cross-document symbol lookup, diagnostics,
 * and editor features such as completion, hover, rename, and navigation.
 */
export class Identifiers {
  registry = new Map(
    actions.map(action => [
      action,
      {
        definitions: new Map<string, Range[]>(),
        references: new Map<string, Range[]>(),
      },
    ]),
  );

  constructor(public readonly document: Document) {}

  /**
   * Associates a parsed attribute value with known actions and indexes its
   * tokens.
   */
  associate({ name, value, range }: Attr) {
    if (range) {
      for (const [action, { definitions, references }] of this.registry) {
        action.isOutput(name) && this.addTokenRanges(definitions, value, range);
        action.isInput(name) && this.addTokenRanges(references, value, range);
      }
    }
  }

  /**
   * Extracts and indexes valid tokens from a value within a source range.
   *
   * Invalid tokens are ignored.
   */
  addTokenRanges(store: Map<string, Range[]>, value: string, range: Range) {
    for (const { token, characterDelta } of parseTokens(value)) {
      const tokenRange = range.with({
        start: range.start.translate({ characterDelta }),
        end: range.start.translate({
          characterDelta: characterDelta + token.length,
        }),
      });
      isValidToken(token) &&
        (store.get(token)?.push(tokenRange) ?? store.set(token, [tokenRange]));
    }
  }

  /**
   * Recomputes diagnostics for the document based on current symbol state.
   *
   * Updates unresolved and unused symbol diagnostics.
   */
  resolve() {
    const diagnostics: Diagnostic[] = [];

    config.UNUSED == null ||
      this.addDiagnostics("definitions", config.UNUSED, diagnostics);
    config.UNRESOLVED == null ||
      this.addDiagnostics("references", config.UNRESOLVED, diagnostics);

    diagnosticCollection.set(
      this.document.uri,
      diagnostics.concat(this.document.diagnostics.data),
    );
  }

  /**
   * Finds a document containing a specific token for a given action and
   * collection type.
   */
  findDocument(
    action: Action,
    collection: "definitions" | "references",
    token: string,
  ) {
    for (const document of documents.values()) {
      if (document.identifiers.registry.get(action)![collection].has(token)) {
        return document;
      }
    }
  }

  /**
   * Generates diagnostics for missing or unresolved symbols.
   */
  addDiagnostics(
    collection: "definitions" | "references",
    severity: DiagnosticSeverity,
    diagnostics: Diagnostic[],
  ) {
    for (const [action, entry] of this.registry) {
      for (const [token, ranges] of entry[collection]) {
        if (
          this.findDocument(
            action,
            collection === "definitions" ? "references" : "definitions",
            token,
          )
        ) {
          continue;
        }
        for (const range of ranges) {
          const diagnostic = new Diagnostic(
            range,
            template[collection]({
              name: action.name,
              token,
            }),
            severity,
          );
          diagnostic.source = "KEML";
          if (
            collection === "definitions" &&
            severity === DiagnosticSeverity.Warning
          ) {
            diagnostic.tags = [DiagnosticTag.Unnecessary];
          }
          diagnostics.push(diagnostic);
        }
      }
    }
  }

  /**
   * Provides completion items for known tokens in the current context.
   *
   * Suggests values based on indexed symbols across the workspace.
   */
  provideCompletionItems(
    attr: Attr,
    position: Position,
    completions: CompletionItem[],
  ) {
    const action = findAction(attr.name);
    if (!action) {
      return completions;
    }

    const tp = this.document.tokenAtPosition(attr, position);
    const range = tp?.range ?? new Range(position, position);

    for (const {
      identifiers: { registry },
    } of documents.values()) {
      const { definitions, references } = registry.get(action)!;

      for (const token of combineIterators(
        definitions.keys(),
        references.keys(),
      )) {
        let found;
        for (const { label } of completions) {
          if (
            (found =
              (typeof label === "string" ? label : label.label) === token)
          ) {
            break;
          }
        }
        if (found) {
          continue;
        }
        const item = new CompletionItem(token, CompletionItemKind.Value);
        item.preselect = true;
        item.insertText = token;
        item.range = range;
        item.documentation = new MarkdownString(
          TOKEN_TPL({ name: action.name, token }),
        );
        completions.push(item);
      }
    }

    return completions;
  }

  /**
   * Provides hover information for a token at the given position.
   */
  provideHover(attr: Attr, position: Position) {
    const action = findAction(attr.name);
    const tp = this.document.tokenAtPosition(attr, position);

    if (action && tp) {
      return new Hover(
        new MarkdownString(
          TOKEN_TPL({
            name: action.name,
            token: tp.token,
          }),
        ),
        tp.range,
      );
    }
  }

  /**
   * Retrieves locations of a token across workspace documents.
   */
  getLocations(
    attr: Attr,
    token: string,
    collection: "definitions" | "references",
  ) {
    const action = findAction(attr.name);

    if (!action) {
      return;
    }

    const result: Location[] = [];

    for (const {
      uri,
      identifiers: { registry },
    } of documents.values()) {
      const ranges = registry.get(action)![collection].get(token);
      if (ranges) {
        for (const range of ranges) {
          result.push(new Location(uri, range));
        }
      }
    }

    return result;
  }

  /**
   * Produces workspace edits to rename all occurrences of a token.
   */
  provideRenameEdits(attr: Attr, position: Position, newName: string) {
    const action = findAction(attr.name);
    const tp = this.document.tokenAtPosition(attr, position);
    if (!action || !tp) {
      return;
    }

    const edit = new WorkspaceEdit();

    for (const {
      uri,
      identifiers: { registry },
    } of documents.values()) {
      const { definitions, references } = registry.get(action)!;

      for (const range of [
        ...(definitions.get(tp.token) ?? []),
        ...(references.get(tp.token) ?? []),
      ]) {
        edit.replace(uri, range, newName);
      }
    }

    return edit;
  }

  /**
   * Provides highlight ranges for a token within the document.
   */
  provideDocumentHighlights(attr: Attr, position: Position) {
    const action = findAction(attr.name);
    const tp = this.document.tokenAtPosition(attr, position);
    if (!action || !tp) {
      return;
    }
    const { definitions, references } = this.registry.get(action)!;

    return [
      ...(definitions.get(tp.token) ?? []),
      ...(references.get(tp.token) ?? []),
    ].map(range => new DocumentHighlight(range));
  }

  /**
   * Provides document symbols for all indexed tokens in the document.
   */
  provideDocumentSymbols() {
    const result: DocumentSymbol[] = [];

    for (const { definitions, references } of this.registry.values()) {
      for (const [name, ranges] of combineIterators(
        definitions.entries(),
        references.entries(),
      )) {
        for (const range of ranges) {
          result.push(
            new DocumentSymbol(name, "", SymbolKind.Constant, range, range),
          );
        }
      }
    }

    return result;
  }
}
