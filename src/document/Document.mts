import {
  Range,
  ReferenceContext,
  type Position,
  type TextDocument,
  type TextDocumentChangeEvent,
  type Uri,
} from "vscode";
import {
  TextDocument as LSTextDocument,
  type HTMLDocument,
  type Node as LSNode,
} from "vscode-html-languageservice";
import { setNode } from "../action/data.mts";
import { service } from "../service/service.mts";
import { sortByStart } from "../util/sortByStart.mts";
import { convertCompletionItem } from "./convertCompletionItem.mts";
import { convertHover } from "./convertHover.mts";
import { matchLanguageId, matchUri } from "./data.mts";
import { Diagnostics } from "./Diagnostics.mts";
import { Identifiers } from "./Identifiers.mts";
import { Node } from "./Node.mts";
import { parseTokens } from "./parseTokens.mts";

/**
 * Represents a parsed workspace document with language features support.
 *
 * Provides syntax-aware navigation, completions, diagnostics, references,
 * renaming, and symbol extraction based on an internal HTML-like structure.
 */
export class Document {
  textDoc: LSTextDocument;
  private htmlDoc!: HTMLDocument;
  nodes!: Node[];
  uri: Uri;
  identifiers!: Identifiers;
  diagnostics!: Diagnostics;

  constructor(public doc: TextDocument) {
    this.uri = doc.uri;
    this.textDoc = LSTextDocument.create(
      this.url,
      "html",
      this.version,
      this.text,
    );
    this.parse();
  }

  get url() {
    return this.uri.toString();
  }

  get languageId() {
    return this.doc.languageId;
  }

  get version() {
    return this.doc.version;
  }

  get text() {
    return this.getText();
  }

  getText(range?: Range) {
    return this.doc.getText(range);
  }

  offsetAt(position: Position) {
    return this.doc.offsetAt(position);
  }

  positionAt(offset: number) {
    return this.doc.positionAt(offset);
  }

  rangeBetween(start: number, end: number) {
    return new Range(this.positionAt(start), this.positionAt(end));
  }

  createScanner(initialOffset?: number | undefined, range?: Range | undefined) {
    return service.createScanner(this.getText(range), initialOffset);
  }

  /**
   * Resolves the token at a given position within an attribute value.
   */
  tokenAtPosition({ range, value }: Attr, position: Position) {
    if (!range) {
      return;
    }
    const start = this.offsetAt(range.start);
    const offset = this.offsetAt(position) - start;
    const tokens = parseTokens(value);

    for (const { token, characterDelta } of tokens) {
      if (offset >= characterDelta && offset <= characterDelta + token.length) {
        return {
          token,
          range: this.rangeBetween(
            start + characterDelta,
            start + characterDelta + token.length,
          ),
        };
      }
    }
  }

  /**
   * Retrieves the syntax node containing the given character offset.
   */
  nodeAt(offset: number) {
    const { nodes } = this;
    let low = 0;
    let high = nodes.length - 1;
    let mid, node;

    while (low <= high) {
      mid = (low + high) >> 1;
      node = nodes[mid]!;

      if (offset < node.start) {
        high = mid - 1;
      } else if (offset > (node.startTagEnd ?? node.start)) {
        low = mid + 1;
      } else {
        return node;
      }
    }
  }

  /**
   * Determines whether a document is supported by the language system.
   */
  static isApplicable(languageId: string, uri: Uri) {
    return matchLanguageId(languageId) && matchUri(uri);
  }

  /**
   * Determines whether a document is supported by the language system.
   */
  isApplicable() {
    return Document.isApplicable(this.languageId, this.uri);
  }

  /**
   * Updates the document state from a text change event and re-parses content.
   */
  update({ document, contentChanges }: TextDocumentChangeEvent) {
    this.doc = document;
    this.uri = this.doc.uri;

    if (!contentChanges.length) {
      return;
    }

    this.textDoc = LSTextDocument.update(
      this.textDoc,
      contentChanges.slice(),
      this.version,
    );
    this.parse();
  }

  /**
   * Provides completion items for the document at the given position.
   */
  provideCompletionItems(position: Position) {
    const offset = this.offsetAt(position);

    const node = this.nodeAt(offset);
    if (!node) {
      return;
    }
    setNode(node);

    const completions = service
      .doComplete(this.textDoc, position, this.htmlDoc)
      .items.flatMap(convertCompletionItem);

    const attr = node.findAttrAt(offset);

    return attr ?
        this.identifiers.provideCompletionItems(attr, position, completions)
      : completions;
  }

  /**
   * Provides hover information for the document at the given position.
   */
  provideHover(position: Position) {
    const offset = this.offsetAt(position);

    const node = this.nodeAt(offset);
    if (!node) {
      return;
    }
    setNode(node);

    const hover = service.doHover(this.textDoc, position, this.htmlDoc);
    if (hover) {
      return convertHover(hover);
    }

    const attr = node.findAttrAt(offset);
    if (!attr) {
      return;
    }

    return this.identifiers.provideHover(attr, position);
  }

  /**
   * Provides definition locations for symbols at the given position.
   */
  provideDefinition(position: Position) {
    const offset = this.offsetAt(position);

    const node = this.nodeAt(offset);
    if (!node) {
      return;
    }
    setNode(node);

    const attr = node.findAttrAt(offset);
    if (!attr) {
      return;
    }

    const tp = this.tokenAtPosition(attr, position);
    if (!tp) {
      return;
    }

    return this.identifiers.getLocations(attr, tp.token, "definitions");
  }

  /**
   * Provides reference locations for symbols at the given position.
   */
  provideReferences(
    position: Position,
    { includeDeclaration }: ReferenceContext,
  ) {
    const offset = this.offsetAt(position);

    const node = this.nodeAt(offset);
    if (!node) {
      return;
    }
    setNode(node);

    const attr = node.findAttrAt(offset);
    if (!attr) {
      return;
    }

    const tp = this.tokenAtPosition(attr, position);
    if (!tp) {
      return;
    }

    const references = this.identifiers.getLocations(
      attr,
      tp.token,
      "references",
    );

    return includeDeclaration ?
        references?.concat(
          this.identifiers.getLocations(attr, tp.token, "definitions") ?? [],
        )
      : references;
  }

  /**
   * Prepares a rename operation by resolving the target range and placeholder.
   */
  prepareRename(position: Position) {
    const offset = this.offsetAt(position);
    const node = this.nodeAt(offset);
    const attr = node?.findAttrAt(offset);

    if (!attr) {
      throw new Error("Nothing to rename.");
    }

    const tp = this.tokenAtPosition(attr, position);
    if (!tp) {
      throw new Error("Nothing to rename.");
    }

    return { range: tp.range, placeholder: tp.token };
  }

  /**
   * Provides workspace edits to rename a symbol at the given position.
   */
  provideRenameEdits(position: Position, newName: string) {
    const offset = this.offsetAt(position);
    const node = this.nodeAt(offset);

    const attr = node?.findAttrAt(offset);
    if (!attr) {
      return;
    }

    return this.identifiers.provideRenameEdits(attr, position, newName);
  }

  /**
   * Provides highlight ranges for symbols at the given position.
   */
  provideDocumentHighlights(position: Position) {
    const offset = this.offsetAt(position);
    const node = this.nodeAt(offset);

    const attr = node?.findAttrAt(offset);
    if (!attr) {
      return;
    }

    return this.identifiers.provideDocumentHighlights(attr, position);
  }

  /**
   * Provides all document symbols for navigation and outline views.
   */
  provideDocumentSymbols() {
    return this.identifiers.provideDocumentSymbols();
  }

  parse() {
    this.nodes = [];
    this.identifiers = new Identifiers(this);
    this.diagnostics = new Diagnostics();
    this.htmlDoc = service.parseHTMLDocument(this.textDoc);

    const stack = [this.htmlDoc.roots];
    let nodes: LSNode[] | undefined;

    while ((nodes = stack.pop())) {
      for (const node of nodes) {
        stack.push(node.children);
        this.parseNode(new Node(this, node));
      }
    }

    this.nodes.sort(sortByStart);
  }

  parseNode(node: Node) {
    this.nodes.push(node);

    for (const attr of node.attributes.values()) {
      this.identifiers.associate(attr);
      this.diagnostics.associate(attr);
    }
  }
}
