import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticTag,
  Hover,
  Position,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
  Uri,
} from "vscode";
import {
  HTMLDocument,
  Node as LSNode,
  TextDocument as LSTextDocument,
  TokenType,
} from "vscode-html-languageservice";
import { addCompletions } from "./addCompletions.mts";
import { addDefinitionRanges } from "./addDefinitionRanges.mts";
import { addRange } from "./addRange.mts";
import { convertCompletionItem } from "./convertCompletionItem.mts";
import { convertDocumentation } from "./convertDocumentation.mts";
import { convertHover } from "./convertHover.mts";
import {
  getExclude,
  getInclude,
  getLanguageIds,
  setAttributes,
} from "./data.mts";
import { getEventDefinitions } from "./getEventDefinitions.mts";
import { getEventReferences } from "./getEventReferences.mts";
import { getEventValue } from "./getEventValue.mts";
import { getExistingActionValue } from "./getExistingActionValue.mts";
import { getLocations } from "./getLocations.mts";
import { getResultDefinitions } from "./getResultDefinitions.mts";
import { getResultReferences } from "./getResultReferences.mts";
import { getResultValue } from "./getResultValue.mts";
import { getStateDefinitions } from "./getStateDefinitions.mts";
import { getStateReferences } from "./getStateReferences.mts";
import { getStateValue } from "./getStateValue.mts";
import { isEventDefinition } from "./isEventDefinition.mts";
import { isEventFilter } from "./isEventFilter.mts";
import { isEventReference } from "./isEventReference.mts";
import { isPosition } from "./isPosition.mts";
import { isResultDefinition } from "./isResultDefinition.mts";
import { isResultReference } from "./isResultReference.mts";
import { isStateDefinition } from "./isStateDefinition.mts";
import { isStateReference } from "./isStateReference.mts";
import { isTagOnDependent } from "./isTagOnDependent.mts";
import { match } from "./match.mts";
import { Node } from "./node.mts";
import { INVALID_PATTERN } from "./parseTokens.mts";
import { service } from "./service.mts";
import { sortByZero } from "./sortByZero.mts";
import { t } from "./t.mts";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection.mts";

const HEAD_PATTERN = /^(?:\s*["'])?/;
const TAIL_PATTERN = /(?:["']\s*)?$/;
const END_SPACE_PATTERN = /(?:^\s|\s$)/;
const WORD_PATTERN = /[^"'\s]+/;
const validPosition = [
  "replaceChildren",
  "replaceWith",
  "before",
  "after",
  "prepend",
  "append",
];
const DEP_TPL = t`'${"name"}' without ${"article"} '${"depends"}' (or 'x-${"depends"}') does nothing.`;

/**
 * Represents a document update task, potentially linked to the next task in a
 * queue.
 */
interface UpdateTask extends TextDocumentChangeEvent {
  /**
   * Reference to the next update task in the chain, if any.
   */
  next?: UpdateTask;
}

/**
 * Represents a document with diagnostics, references, and definitions.
 */
export class Document {
  /**
   * List of diagnostics for the document.
   */
  diagnostics!: Diagnostic[];

  /**
   * Map of event action names to their definition ranges.
   */
  event_definitions!: Map<string, Range[]>;

  /**
   * Map of event action names to their reference ranges.
   */
  event_references!: Map<string, Range[]>;

  /**
   * Map of state action names to their definition ranges.
   */
  state_definitions!: Map<string, Range[]>;

  /**
   * Map of state action names to their reference ranges.
   */
  state_references!: Map<string, Range[]>;

  /**
   * Map of result action names to their definition ranges.
   */
  result_definitions!: Map<string, Range[]>;

  /**
   * Map of result action names to their reference ranges.
   */
  result_references!: Map<string, Range[]>;

  /**
   * The URI of the document.
   */
  private _uri!: Uri;

  /**
   * The string representation of the document URI.
   */
  private _url!: string;

  /**
   * The language server text document wrapper.
   */
  private textDoc: LSTextDocument;

  /**
   * The parsed HTML document.
   */
  private htmlDoc!: HTMLDocument;

  /**
   * Array of ranges mapped to nodes in the document.
   */
  private ranges!: [number, number, Node][];

  /**
   * Identifier of the scheduled update timeout.
   */
  private timeoutId: NodeJS.Timeout | undefined;

  /**
   * The first pending update task in the queue.
   */
  private firstUpdateTask: UpdateTask | undefined;

  /**
   * The last pending update task in the queue.
   */
  private lastUpdateTask: UpdateTask | undefined;

  /**
   * Creates a new Document instance.
   *
   * @param doc - The text document to wrap.
   */
  constructor(private doc: TextDocument) {
    const { uri, version } = doc;

    this.uri = uri;
    this.textDoc = LSTextDocument.create(
      uri.toString(),
      "html",
      version,
      doc.getText()
    );
    this.parseHTMLDocument();
  }

  /**
   * Sets the document URI and updates the URL string.
   *
   * @param uri - The new URI of the document.
   */
  set uri(uri: Uri) {
    this._uri = uri;
    this._url = uri.toString();
  }

  /**
   * Returns the document URI.
   */
  get uri() {
    return this._uri;
  }

  /**
   * Returns the document URL string.
   */
  get url() {
    return this._url;
  }

  /**
   * Returns the language identifier of the document.
   */
  get languageId() {
    this.update();
    return this.doc.languageId;
  }

  /**
   * Returns the version number of the document.
   */
  get version() {
    this.update();
    return this.doc.version;
  }

  /**
   * Retrieves the text of the document or a subset defined by a range.
   *
   * @param range - Optional range to extract text from.
   * @returns The extracted text.
   */
  getText(range?: Range | undefined) {
    this.update();
    return this.doc.getText(range);
  }

  /**
   * Converts an offset to a position in the document.
   *
   * @param offset - The character offset.
   * @returns The position in the document.
   */
  positionAt(offset: number) {
    this.update();
    return this.doc.positionAt(offset);
  }

  /**
   * Converts a position to an offset in the document.
   *
   * @param position - The position to convert.
   * @returns The character offset.
   */
  offsetAt(position: Position) {
    this.update();
    return this.doc.offsetAt(position);
  }

  /**
   * Returns a range between two offsets.
   *
   * @param start - Start offset.
   * @param end - End offset.
   * @returns The range spanning start to end.
   */
  rangeBetween(start: number, end: number) {
    return new extern.Range(this.positionAt(start), this.positionAt(end));
  }

  /**
   * Returns the word range at a specified position.
   *
   * @param position - Position to examine.
   * @param regex - Optional regex to match word boundaries.
   * @returns The word range at the position.
   */
  getWordRangeAtPosition(position: Position, regex = WORD_PATTERN) {
    this.update();
    return this.doc.getWordRangeAtPosition(position, regex);
  }

  /**
   * Finds a node at the given offset.
   *
   * @param offset - The character offset.
   * @returns The node at the offset or undefined.
   */
  findNodeAt(offset: number) {
    this.update();
    let low = 0;
    let high = this.ranges.length - 1;
    let mid, range;

    while (low <= high) {
      mid = (low + high) >> 1;
      range = this.ranges[mid]!;

      if (offset < range[0]) {
        high = mid - 1;
      } else if (offset > range[1]) {
        low = mid + 1;
      } else {
        return range[2];
      }
    }

    return;
  }

  /**
   * Determines if a document is applicable based on language ID and URI.
   *
   * @param languageId - The document's language identifier.
   * @param uri - The document URI.
   * @returns True if applicable, false otherwise.
   */
  static isApplicable(languageId: string, uri: Uri) {
    return (
      extern.getLanguageIds().includes(languageId) &&
      extern.match(uri.path, extern.getExclude(), extern.getInclude())
    );
  }

  /**
   * Determines if the current document is applicable.
   *
   * @returns True if applicable, false otherwise.
   */
  isApplicable() {
    this.update();
    return Document.isApplicable(this.languageId, this.uri);
  }

  /**
   * Returns completion items at a given position.
   *
   * @param position - The position to complete at.
   * @returns Completion items or undefined.
   */
  doComplete(position: Position) {
    const offset = this.offsetAt(position);
    const node = this.findNodeAt(offset);
    if (!node) {
      return;
    }

    extern.setAttributes(node.attributes);
    const completions = extern.service
      .doComplete(this.textDoc, position, this.htmlDoc)
      .items.map(extern.convertCompletionItem);

    const attr = node.findAttrAt(offset);
    if (!attr) {
      return completions;
    }

    const { name } = attr;
    const range =
      this.getWordRangeAtPosition(position) ??
      new extern.Range(position, position);

    if (extern.isEventDefinition(name)) {
      extern.addCompletions(
        completions,
        getEventDefinitions,
        getEventReferences,
        range,
        getEventValue
      );
    } else if (extern.isStateDefinition(name)) {
      extern.addCompletions(
        completions,
        getStateDefinitions,
        getStateReferences,
        range,
        getStateValue
      );
    } else if (extern.isResultDefinition(name)) {
      extern.addCompletions(
        completions,
        getResultDefinitions,
        getResultReferences,
        range,
        getResultValue
      );
    }

    return completions;
  }

  /**
   * Returns hover information at a given position.
   *
   * @param position - The position to hover over.
   * @returns Hover data or undefined.
   */
  doHover(position: Position) {
    const offset = this.offsetAt(position);
    const node = this.findNodeAt(offset);
    if (!node) {
      return;
    }

    extern.setAttributes(node.attributes);
    const hover = extern.service.doHover(this.textDoc, position, this.htmlDoc);
    if (hover) {
      return extern.convertHover(hover);
    }

    const range = this.getWordRangeAtPosition(position);
    if (!range) {
      return;
    }

    const attr = node.findAttrAt(offset);
    if (!attr) {
      return;
    }

    const { name } = attr;
    let definitionsGetter, valueGetter;

    if (extern.isEventDefinition(name)) {
      definitionsGetter = getEventDefinitions;
      valueGetter = getEventValue;
    } else if (extern.isStateDefinition(name)) {
      definitionsGetter = getStateDefinitions;
      valueGetter = getStateValue;
    } else if (extern.isResultDefinition(name)) {
      definitionsGetter = getResultDefinitions;
      valueGetter = getResultValue;
    } else {
      return;
    }

    const valueData = extern.getExistingActionValue(
      this.getText(range),
      definitionsGetter,
      valueGetter
    );
    if (!valueData || !valueData.description) {
      return;
    }

    return new extern.Hover(
      extern.convertDocumentation(valueData.description),
      range
    );
  }

  /**
   * Resolves references for events, states, or results at a position.
   *
   * @param eventResolver - Resolver for event definitions.
   * @param stateResolver - Resolver for state definitions.
   * @param resultResolver - Resolver for result definitions.
   * @param position - Position to resolve references.
   * @returns Locations of references or undefined.
   */
  doRefer(
    eventResolver: (cur: Document) => Map<string, Range[]>,
    stateResolver: (cur: Document) => Map<string, Range[]>,
    resultResolver: (cur: Document) => Map<string, Range[]>,
    position: Position
  ) {
    const offset = this.offsetAt(position);
    const node = this.findNodeAt(offset);
    if (!node) {
      return;
    }

    const attr = node.findAttrAt(offset);
    if (!attr) {
      return;
    }

    let { name, value } = attr;

    if (extern.isEventReference(name)) {
      return extern.getLocations(value, eventResolver);
    }

    if (extern.isStateReference(name)) {
      return extern.getLocations(value, stateResolver);
    }

    if (extern.isResultReference(name)) {
      return extern.getLocations(value, resultResolver);
    }

    const range = this.getWordRangeAtPosition(position);
    if (!range) {
      return;
    }

    value = this.getText(range);

    if (extern.isEventDefinition(name)) {
      return extern.getLocations(value, eventResolver);
    }

    if (extern.isStateDefinition(name)) {
      return extern.getLocations(value, stateResolver);
    }

    if (extern.isResultDefinition(name)) {
      return extern.getLocations(value, resultResolver);
    }

    return;
  }

  /**
   * Schedules a document update after a change event.
   *
   * @param event - The text document change event.
   */
  scheduleUpdate(event: TextDocumentChangeEvent) {
    clearTimeout(this.timeoutId);
    this.lastUpdateTask =
      this.lastUpdateTask == null
        ? (this.firstUpdateTask = event)
        : (this.lastUpdateTask.next = event);
    this.timeoutId = setTimeout(this.update, 300);
  }

  /**
   * Updates the document and re-parses its content.
   */
  private update = () => {
    if (this.firstUpdateTask == null) {
      return;
    }
    let task: UpdateTask | undefined;
    const contentChanges: TextDocumentContentChangeEvent[] = [];

    while ((task = this.firstUpdateTask)) {
      this.firstUpdateTask = task.next;
      this.doc = task.document;
      contentChanges.push(...task.contentChanges);
    }
    this.lastUpdateTask = undefined;

    if (!contentChanges.length) {
      return;
    }
    this.uri = this.doc.uri;
    this.textDoc = LSTextDocument.update(
      this.textDoc,
      contentChanges,
      this.version
    );
    this.parseHTMLDocument();
    extern.updateDiagnosticCollection();
  };

  /**
   * Creates a scanner for parsing the document text.
   *
   * @param initialOffset - Optional starting offset for the scanner.
   * @param range - Optional range of text to scan.
   * @returns The scanner instance.
   */
  private createScanner(
    initialOffset?: number | undefined,
    range?: Range | undefined
  ) {
    return extern.service.createScanner(this.getText(range), initialOffset);
  }

  /**
   * Parses the attributes of a node and records their ranges.
   *
   * @param node - The node whose attributes are being parsed.
   * @returns A map of attribute names to their details.
   */
  private parseNodeAttrs(node: LSNode) {
    const { attributes, start, startTagEnd, tag } = node;
    const newNode = new extern.Node(node);

    if (!startTagEnd) {
      return newNode.attributes;
    }

    this.ranges.push([start, startTagEnd, newNode]);

    if (!attributes || !tag) {
      return newNode.attributes;
    }

    const scanner = this.createScanner(start);
    let tokenEnd = -1;
    let token,
      name,
      nameOffset,
      tokenOffset,
      tokenText,
      head,
      tail,
      offset,
      end;

    while (
      tokenEnd < startTagEnd &&
      (token = scanner.scan()) !== TokenType.EOS
    ) {
      tokenEnd = scanner.getTokenEnd();
      if (token === TokenType.AttributeName) {
        name = scanner.getTokenText();
        nameOffset = scanner.getTokenOffset();

        newNode.setAttribute(name, null);
      } else if (
        name != null &&
        nameOffset != null &&
        token === TokenType.AttributeValue
      ) {
        tokenOffset = scanner.getTokenOffset();
        tokenText = scanner.getTokenText();
        head = HEAD_PATTERN.exec(tokenText)![0].length;
        tail = TAIL_PATTERN.exec(tokenText)![0].length * -1;
        offset = tokenOffset + head;
        end = tokenEnd + tail;

        newNode.setAttribute(name, {
          name,
          value: tokenText.slice(head, tail),
          start: offset,
          end,
          range: this.rangeBetween(offset, end),
          fullRange: this.rangeBetween(nameOffset, tokenEnd),
        });
        name = undefined;
      }
    }

    return newNode.attributes;
  }

  /**
   * Adds a diagnostic if a dependent attribute is missing.
   *
   * @param attributes - The attributes of the node to check.
   * @param range - The range associated with the diagnostic.
   * @param name - The name of the current attribute.
   * @param depends - The name of the dependent attribute.
   * @param article - Optional article to use in the diagnostic message.
   */
  private addDependsDiagnostic(
    attributes: Record<string, string | null>,
    range: Range,
    name: string,
    depends: string,
    article = "a"
  ) {
    if (depends in attributes || `x-${depends}` in attributes) {
      return;
    }

    const diagnostic = new extern.Diagnostic(
      range,
      DEP_TPL({ name, article, depends }),
      DiagnosticSeverity.Warning
    );
    diagnostic.source = "KEML";
    diagnostic.tags = [DiagnosticTag.Unnecessary];
    this.diagnostics.push(diagnostic);
  }

  /**
   * Parses the document as HTML, extracting nodes, attributes, and definitions.
   *
   * Updates diagnostics, event/state/result definitions, and reference maps.
   */
  private parseHTMLDocument() {
    this.diagnostics = [];
    this.ranges = [];
    this.event_definitions = new Map<string, Range[]>();
    this.event_references = new Map<string, Range[]>();
    this.state_definitions = new Map<string, Range[]>();
    this.state_references = new Map<string, Range[]>();
    this.result_definitions = new Map<string, Range[]>();
    this.result_references = new Map<string, Range[]>();
    this.htmlDoc = extern.service.parseHTMLDocument(this.textDoc);

    const stack = [this.htmlDoc.roots];
    let nodes, node, diagnostic, tag, attributes, name, value, range, fullRange;

    while ((nodes = stack.pop())) {
      for (node of nodes) {
        stack.push(node.children);
        tag = node.tag;
        attributes = node.attributes ?? {};

        for (const attr of this.parseNodeAttrs(node).values()) {
          if (!attr) {
            continue;
          }
          name = attr.name;
          value = attr.value;
          range = attr.range;
          fullRange = attr.fullRange;
          if (extern.isEventDefinition(name)) {
            extern.addDefinitionRanges(this.event_definitions, value, range);
          } else if (extern.isEventReference(name)) {
            extern.addRange(this.event_references, value, range);
          } else if (extern.isStateDefinition(name)) {
            extern.addDefinitionRanges(this.state_definitions, value, range);
          } else if (extern.isStateReference(name)) {
            extern.addRange(this.state_references, value, range);
          } else if (extern.isResultDefinition(name)) {
            extern.addDefinitionRanges(this.result_definitions, value, range);
          } else if (extern.isResultReference(name)) {
            extern.addRange(this.result_references, value, range);
          }
          if (
            extern.isEventReference(name) ||
            extern.isStateReference(name) ||
            extern.isResultReference(name)
          ) {
            if (!value) {
              diagnostic = new extern.Diagnostic(
                fullRange,
                "No action specified.",
                DiagnosticSeverity.Warning
              );
              diagnostic.source = "KEML";
              diagnostic.tags = [DiagnosticTag.Unnecessary];
              this.diagnostics.push(diagnostic);
            } else if (END_SPACE_PATTERN.test(value)) {
              diagnostic = new extern.Diagnostic(
                fullRange,
                `Action subscribers are only allowed to hold 1 value and are used verbatim.
Make sure not to have any spaces in the action name.`,
                DiagnosticSeverity.Error
              );
              diagnostic.source = "KEML";
              this.diagnostics.push(diagnostic);
            }
          }
          if (extern.isEventFilter(name)) {
            this.addDependsDiagnostic(
              attributes,
              fullRange,
              name,
              `on${name.slice(name.indexOf(":"))}`,
              "a corresponding"
            );
          }
          if (extern.isTagOnDependent(tag!, name)) {
            this.addDependsDiagnostic(attributes, fullRange, name, "on", "an");
          }
          if (extern.isPosition(name)) {
            this.addDependsDiagnostic(attributes, fullRange, name, "render");
            if (
              !validPosition.includes(value) &&
              !extern.INVALID_PATTERN.test(value)
            ) {
              diagnostic = new extern.Diagnostic(
                fullRange,
                `Invalid render position specified.
Must be one of: ${validPosition.join(", ")}.`,
                DiagnosticSeverity.Error
              );
              diagnostic.source = "KEML";
              this.diagnostics.push(diagnostic);
            }
          }
          if (name.startsWith("x-")) {
            this.addDependsDiagnostic(attributes, fullRange, name, "if", "an");
          }
        }
      }
    }
    this.ranges.sort(extern.sortByZero);
  }
}

let extern = {
  Diagnostic,
  Hover,
  Range,
  addCompletions,
  addDefinitionRanges,
  addRange,
  convertCompletionItem,
  convertDocumentation,
  convertHover,
  getExclude,
  getInclude,
  getLanguageIds,
  setAttributes,
  getExistingActionValue,
  getLocations,
  isEventDefinition,
  isEventFilter,
  isEventReference,
  isPosition,
  isResultDefinition,
  isResultReference,
  isStateDefinition,
  isStateReference,
  isTagOnDependent,
  match,
  Node,
  INVALID_PATTERN,
  service,
  sortByZero,
  updateDiagnosticCollection,
};

/* v8 ignore start */
import type { Mock, MockInstance } from "vitest";

if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    afterEach,
    afterAll,
    vi: {
      fn,
      runAllTimers,
      useFakeTimers,
      useRealTimers,
      spyOn,
      restoreAllMocks,
    },
  } = import.meta.vitest;
  const { getLanguageService } = await import("vscode-html-languageservice");
  const origExtern = extern;
  const testService = getLanguageService();

  class MockTextDocument implements TextDocument {
    fileName = "file";
    isUntitled = true;
    encoding = "utf8";
    version = 42;
    isDirty = false;
    isClosed = false;
    eol = 1;
    lineCount: number;
    uri = { toString: () => `file://${this.fileName}` } as any;
    languageId = "keml";
    constructor(public html: string) {
      this.lineCount = this.html.split("\n").length;
    }
    getText(range?: Range) {
      return range == null
        ? this.html
        : this.html.slice(this.offsetAt(range.start), this.offsetAt(range.end));
    }
    validatePosition(position: Position) {
      return position;
    }
    validateRange(range: Range) {
      return range;
    }
    offsetAt({ line, character }: Position) {
      return (
        this.html.split("\n").slice(0, line).join("\n").length +
        character +
        +!!line
      );
    }
    async save() {
      return true;
    }
    lineAt(place: number | Position) {
      const lineNumber = typeof place === "number" ? place : place.line;
      const lines = this.html.split("\n").slice(0, lineNumber + 1);
      const text = lines.pop() ?? "";
      const start = lines.join("\n").length + (lineNumber > 0 ? 1 : 0);
      return {
        lineNumber,
        text,
        range: {
          start: this.positionAt(start),
          end: this.positionAt(start + text.length),
        } as Range,
        rangeIncludingLineBreak: {
          start: this.positionAt(start - (lineNumber > 1 ? 1 : 0)),
          end: this.positionAt(
            start + text.length + (lineNumber < this.lineCount - 1 ? 1 : 0)
          ),
        } as Range,
        firstNonWhitespaceCharacterIndex: text.search(/\S/),
        isEmptyOrWhitespace: !/\S/.test(text),
      };
    }
    positionAt(offset: number) {
      const slice = this.html.slice(0, offset);
      return {
        line: slice.match(/\n/g)?.length ?? 0,
        character: offset - slice.lastIndexOf("\n") - 1,
      } as Position;
    }

    getWordRangeAtPosition(position: Position, regex = /\w+/) {
      const offset = this.offsetAt(position);
      const start = new RegExp(`${regex.source}$`, regex.flags).exec(
        this.html.slice(0, offset)
      )?.[0].length;
      const end = new RegExp(`^${regex.source}`, regex.flags).exec(
        this.html.slice(offset)
      )?.[0].length;
      let startOffset, endOffset;
      startOffset = endOffset = offset;

      if (start != null) {
        startOffset -= start;
      } else if (end == null) {
        return;
      }
      if (end != null) {
        endOffset += end;
      } else if (start == null) {
        return;
      }

      return {
        start: this.positionAt(startOffset),
        end: this.positionAt(endOffset),
      } as Range;
    }
  }

  class TestDocument extends Document {
    constructor(html: string) {
      super(new MockTextDocument(html));
    }
  }

  let setAttr: Mock<(name: string, value: any) => any>;
  let update: MockInstance<(typeof LSTextDocument)["update"]>;
  let doComplete: MockInstance<(typeof testService)["doComplete"]>;
  let doHover: MockInstance<(typeof testService)["doHover"]>;

  describe("Document", () => {
    beforeAll(() => {
      useFakeTimers();
    });

    beforeEach(() => {
      const attrs = new Map();
      setAttr = fn((name: string, value: any) => attrs.set(name, value));

      extern = {
        Diagnostic: class {
          source?: string;
          tags?: DiagnosticTag[];
          constructor(
            public range: Range,
            public message: string,
            public severity: DiagnosticSeverity
          ) {}
        },
        Hover: class Hover {
          constructor(public contents: any, public range: any) {}
        },
        Range: class {
          constructor(public start: any, public end: any) {}
        } as any,
        addCompletions: fn(),
        addDefinitionRanges: fn(),
        addRange: fn(),
        convertCompletionItem: fn(a => a),
        convertDocumentation: fn(a => a),
        convertHover: fn(a => a),
        getExclude: fn().mockReturnValue([]),
        getInclude: fn().mockReturnValue([]),
        getLanguageIds: fn().mockReturnValue([]),
        setAttributes: fn(),
        getExistingActionValue: fn(),
        getLocations: fn().mockReturnValue(["mock-loc"]),
        isEventDefinition: fn().mockReturnValue(false),
        isEventFilter: fn().mockReturnValue(false),
        isEventReference: fn().mockReturnValue(false) as any,
        isPosition: fn().mockReturnValue(false) as any,
        isResultDefinition: fn().mockReturnValue(false) as any,
        isResultReference: fn().mockReturnValue(false) as any,
        isStateDefinition: fn().mockReturnValue(false),
        isStateReference: fn().mockReturnValue(false) as any,
        isTagOnDependent: fn().mockReturnValue(false),
        match: fn().mockReturnValue(false),
        Node: class extends Node {
          override attributes = attrs;
          override setAttribute = setAttr;
        } as any,
        INVALID_PATTERN: { test: fn().mockReturnValue(true) } as any,
        sortByZero: fn(([a], [b]) => a - b),
        updateDiagnosticCollection: fn(),
        service: testService,
      };
      update = spyOn(LSTextDocument, "update").mockImplementation(a => a);
      doComplete = spyOn(testService, "doComplete").mockImplementation(() => ({
        isIncomplete: true,
        items: ["foo" as any],
      }));
      doHover = spyOn(testService, "doHover").mockImplementation(
        (_, { character }) =>
          character === 7
            ? {
                contents: ["foo"],
              }
            : null
      );
    });

    afterEach(restoreAllMocks);

    afterAll(() => {
      extern = origExtern;
      useRealTimers();
    });

    it("createScanner - no attributes", () => {
      const cur = new TestDocument("<input>");
      expect(cur.uri).toHaveProperty("toString");
      expect(cur.url).toBe("file://file");
    });

    it("createScanner - no tag", () => {
      new TestDocument('< value="lol">');
    });

    it("createScanner - malformed", () => {
      new TestDocument("<input");
    });

    it("createScanner", () => {
      new TestDocument('<input value="lol">');
      expect(setAttr).toBeCalledWith("value", null);
      expect(setAttr).toBeCalledWith("value", {
        end: 17,
        fullRange: {
          end: { character: 18, line: 0 },
          start: { character: 7, line: 0 },
        },
        name: "value",
        range: {
          end: { character: 17, line: 0 },
          start: { character: 14, line: 0 },
        },
        start: 14,
        value: "lol",
      });
    });

    it("parseHTMLDocument - event definition", () => {
      extern.isEventDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument('<input disabled value="lol">');
      expect(extern.isEventDefinition).toBeCalledWith("value");
      expect(extern.addDefinitionRanges).toBeCalledWith(
        cur.event_definitions,
        "lol",
        { end: { character: 26, line: 0 }, start: { character: 23, line: 0 } }
      );
    });

    it("parseHTMLDocument - state definition", () => {
      extern.isStateDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument('<input value="lol">');
      expect(extern.isStateDefinition).toBeCalledWith("value");
      expect(extern.addDefinitionRanges).toBeCalledWith(
        cur.state_definitions,
        "lol",
        { end: { character: 17, line: 0 }, start: { character: 14, line: 0 } }
      );
    });

    it("parseHTMLDocument - result definition", () => {
      extern.isResultDefinition = fn().mockReturnValue(true) as any;
      const cur = new TestDocument('<input value="lol">');
      expect(extern.isResultDefinition).toBeCalledWith("value");
      expect(extern.addDefinitionRanges).toBeCalledWith(
        cur.result_definitions,
        "lol",
        { end: { character: 17, line: 0 }, start: { character: 14, line: 0 } }
      );
    });

    it("parseHTMLDocument - event reference - no value", () => {
      extern.isEventReference = fn().mockReturnValue(true) as any;
      const cur = new TestDocument('<input value="">');
      expect(extern.isEventReference).toBeCalledWith("value");
      expect(extern.addRange).toBeCalledWith(cur.event_references, "", {
        end: { character: 14, line: 0 },
        start: { character: 14, line: 0 },
      });
      expect(cur.diagnostics).toMatchObject([
        {
          range: {
            end: { character: 15, line: 0 },
            start: { character: 7, line: 0 },
          },
          severity: DiagnosticSeverity.Warning,
          source: "KEML",
          tags: [DiagnosticTag.Unnecessary],
        },
      ]);
    });

    it("parseHTMLDocument - state reference - spaces", () => {
      extern.isStateReference = fn().mockReturnValue(true) as any;
      const cur = new TestDocument('<input value=" lol">');
      expect(extern.isStateReference).toBeCalledWith("value");
      expect(extern.addRange).toBeCalledWith(cur.state_references, " lol", {
        end: { character: 18, line: 0 },
        start: { character: 14, line: 0 },
      });
      expect(cur.diagnostics).toMatchObject([
        {
          range: {
            end: { character: 19, line: 0 },
            start: { character: 7, line: 0 },
          },
          severity: DiagnosticSeverity.Error,
        },
      ]);
    });

    it("parseHTMLDocument - result reference", () => {
      extern.isResultReference = fn().mockReturnValue(true) as any;
      const cur = new TestDocument('<input value="lol">');
      expect(extern.isResultReference).toBeCalledWith("value");
      expect(extern.addRange).toBeCalledWith(cur.result_references, "lol", {
        end: { character: 17, line: 0 },
        start: { character: 14, line: 0 },
      });
    });

    it("addDependsDiagnostic - in attributes", () => {
      extern.isEventFilter = fn(name => name.startsWith("event:"));
      const cur = new TestDocument('<input on:value="" event:value="lol">');
      expect(extern.isEventFilter).toBeCalledWith("event:value");
      expect(cur.diagnostics.length).toBe(0);
    });

    it("addDependsDiagnostic - in x-attributes", () => {
      extern.isEventFilter = fn(name => name.startsWith("event:"));
      const cur = new TestDocument(
        '<input if="" x-on:value="" event:value="lol">'
      );
      expect(extern.isEventFilter).toBeCalledWith("event:value");
      expect(cur.diagnostics.length).toBe(0);
    });

    it("parseHTMLDocument - event filter", () => {
      extern.isEventFilter = fn(name => name.startsWith("event:"));
      const cur = new TestDocument('<input if="" event:value="lol">');
      expect(extern.isEventFilter).toBeCalledWith("event:value");
      expect(cur.diagnostics).toMatchObject([
        {
          range: {
            end: { character: 30, line: 0 },
            start: { character: 13, line: 0 },
          },
          severity: DiagnosticSeverity.Warning,
          tags: [DiagnosticTag.Unnecessary],
        },
      ]);
    });

    it("parseHTMLDocument - depends on 'on' which exists", () => {
      extern.isTagOnDependent = fn((_, name) => name === "value");
      const cur = new TestDocument('<input on="" value="lol">');
      expect(extern.isTagOnDependent).toBeCalledWith("input", "value");
      expect(cur.diagnostics.length).toBe(0);
    });

    it("parseHTMLDocument - depends on 'on' which does not exist", () => {
      extern.isTagOnDependent = fn().mockReturnValue(true);
      const cur = new TestDocument('<input value="lol">');
      expect(cur.diagnostics).toMatchObject([
        {
          range: {
            end: { character: 18, line: 0 },
            start: { character: 7, line: 0 },
          },
        },
      ]);
    });

    it("parseHTMLDocument - a position", () => {
      extern.isPosition = fn().mockReturnValue(true) as any;
      const cur = new TestDocument('<input value="lol">');
      expect(extern.isPosition).toBeCalledWith("value");
      expect(cur.diagnostics.length).toBe(1);
    });

    it("parseHTMLDocument - a position with pattern", () => {
      extern.isPosition = fn().mockReturnValue(true) as any;
      extern.INVALID_PATTERN = { test: () => false } as any;
      const cur = new TestDocument('<input value="lol">');
      expect(extern.isPosition).toBeCalledWith("value");
      expect(cur.diagnostics.length).toBe(2);
    });

    it("update - empty", () => {
      const cur = new TestDocument("");
      cur.scheduleUpdate({
        document: new MockTextDocument(""),
        contentChanges: [] as any,
        reason: undefined,
      });
      runAllTimers();
      expect(update).not.toBeCalled();
    });

    it("update", () => {
      const cur = new TestDocument("");
      cur.scheduleUpdate({
        document: new MockTextDocument(""),
        contentChanges: ["bar", "baz"] as any,
        reason: undefined,
      });
      cur.scheduleUpdate({
        document: new MockTextDocument(""),
        contentChanges: ["lol"] as any,
        reason: undefined,
      });
      runAllTimers();
      expect(update).toBeCalledTimes(1);
      expect(update.mock.calls[0]![1]).toEqual(["bar", "baz", "lol"]);
    });

    it("languageId", () => {
      const cur = new TestDocument("");
      expect(cur.languageId).toBe("keml");
    });

    it("offsetAt", () => {
      const cur = new TestDocument("");
      expect(cur.offsetAt({ line: 0, character: 3 } as Position)).toBe(3);
    });

    it("getWordRangeAtPosition", () => {
      const cur = new TestDocument(" foobar ");
      expect(
        cur.getWordRangeAtPosition({ line: 0, character: 3 } as Position)
      ).toMatchObject({
        end: { character: 7, line: 0 },
        start: { character: 1, line: 0 },
      });
    });

    it("findNodeAt", () => {
      const cur = new TestDocument(" <input><br><hr> ");
      expect(cur.findNodeAt(0)).toBeUndefined();
      expect(cur.findNodeAt(3)).toHaveProperty("tag", "input");
      expect(cur.findNodeAt(10)).toHaveProperty("tag", "br");
      expect(cur.findNodeAt(17)).toBeUndefined();
    });

    it("isApplicable", () => {
      extern.getLanguageIds = () => ["html"];
      extern.match = () => false;
      const cur = new TestDocument("");
      expect(cur.isApplicable()).toBeFalsy();
      extern.match = () => true;
      expect(cur.isApplicable()).toBeFalsy();
      extern.getLanguageIds = () => ["keml"];
      expect(cur.isApplicable()).toBeTruthy();
    });

    it("doComplete - no node", () => {
      const cur = new TestDocument(" <input>");
      expect(
        cur.doComplete({ line: 0, character: 0 } as Position)
      ).toBeUndefined();
      expect(extern.setAttributes).not.toBeCalled();
      expect(doComplete).not.toBeCalled();
    });

    it("doComplete - no attribute value", () => {
      const cur = new TestDocument(" <input>");
      expect(
        cur.doComplete({ line: 0, character: 7 } as Position)
      ).toMatchObject(["foo"]);
    });

    it("doComplete - unknown", () => {
      const cur = new TestDocument(' <input value="">');
      cur.doComplete({ line: 0, character: 15 } as Position);
      expect(extern.addCompletions).not.toBeCalled();
    });

    it("doComplete - event definition", () => {
      extern.isEventDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument(' <input value="bar">');
      cur.doComplete({ line: 0, character: 16 } as Position);
      expect(extern.isEventDefinition).toBeCalledWith("value");
      expect(extern.addCompletions).toBeCalledWith(
        ["foo"],
        getEventDefinitions,
        getEventReferences,
        { end: { character: 18, line: 0 }, start: { character: 15, line: 0 } },
        getEventValue
      );
    });

    it("doComplete - state definition", () => {
      extern.isStateDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument(' <input value="bar">');
      cur.doComplete({ line: 0, character: 16 } as Position);
      expect(extern.isStateDefinition).toBeCalledWith("value");
      expect(extern.addCompletions).toBeCalledWith(
        ["foo"],
        getStateDefinitions,
        getStateReferences,
        { end: { character: 18, line: 0 }, start: { character: 15, line: 0 } },
        getStateValue
      );
    });

    it("doComplete - result definition", () => {
      extern.isResultDefinition = fn().mockReturnValue(true) as any;
      const cur = new TestDocument(' <input value="bar">');
      cur.doComplete({ line: 0, character: 16 } as Position);
      expect(extern.isResultDefinition).toBeCalledWith("value");
      expect(extern.addCompletions).toBeCalledWith(
        ["foo"],
        getResultDefinitions,
        getResultReferences,
        { end: { character: 18, line: 0 }, start: { character: 15, line: 0 } },
        getResultValue
      );
    });

    it("doHover - no node", () => {
      const cur = new TestDocument(" <input>");
      expect(
        cur.doHover({ line: 0, character: 0 } as Position)
      ).toBeUndefined();
      expect(extern.setAttributes).not.toBeCalled();
      expect(doHover).not.toBeCalled();
    });

    it("doHover - native", () => {
      const cur = new TestDocument(" <input>");
      expect(cur.doHover({ line: 0, character: 7 } as Position)).toMatchObject({
        contents: ["foo"],
      });
    });

    it("doHover - no value", () => {
      const cur = new TestDocument(' <input value="">');
      expect(
        cur.doHover({ line: 0, character: 15 } as Position)
      ).toBeUndefined();
    });

    it("doHover - no attribute", () => {
      const cur = new TestDocument(" <input>");
      expect(
        cur.doHover({ line: 0, character: 6 } as Position)
      ).toBeUndefined();
    });

    it("doHover - unknown", () => {
      const cur = new TestDocument(' <input value="bar">');
      expect(
        cur.doHover({ line: 0, character: 16 } as Position)
      ).toBeUndefined();
      expect(extern.convertDocumentation).not.toBeCalled();
    });

    it("doHover - event definition", () => {
      extern.isEventDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument(' <input value="bar">');
      expect(
        cur.doHover({ line: 0, character: 16 } as Position)
      ).toBeUndefined();
      expect(extern.getExistingActionValue).toBeCalledWith(
        "bar",
        getEventDefinitions,
        getEventValue
      );
      expect(extern.convertDocumentation).not.toBeCalled();
    });

    it("doHover - state definition", () => {
      extern.isStateDefinition = fn().mockReturnValue(true);
      extern.getExistingActionValue = fn().mockReturnValue({});
      const cur = new TestDocument(' <input value="bar">');
      expect(
        cur.doHover({ line: 0, character: 16 } as Position)
      ).toBeUndefined();
      expect(extern.getExistingActionValue).toBeCalledWith(
        "bar",
        getStateDefinitions,
        getStateValue
      );
      expect(extern.convertDocumentation).not.toBeCalled();
    });

    it("doHover - result definition", () => {
      extern.isResultDefinition = fn().mockReturnValue(true) as any;
      extern.getExistingActionValue = fn().mockReturnValue({
        description: "baz",
      });
      const cur = new TestDocument(' <input value="bar">');
      expect(cur.doHover({ line: 0, character: 16 } as Position)).toMatchObject(
        {
          contents: "baz",
          range: {
            end: { character: 18, line: 0 },
            start: { character: 15, line: 0 },
          },
        }
      );
      expect(extern.getExistingActionValue).toBeCalledWith(
        "bar",
        getResultDefinitions,
        getResultValue
      );
      expect(extern.convertDocumentation).toBeCalledWith("baz");
    });

    it("doRefer - no node", () => {
      const cur = new TestDocument(" <input>");
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          ({ state_definitions }) => state_definitions,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 0 } as Position
        )
      ).toBeUndefined();
      expect(extern.getLocations).not.toBeCalled();
    });

    it("doRefer - no attribute", () => {
      const cur = new TestDocument(" <input>");
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          ({ state_definitions }) => state_definitions,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 6 } as Position
        )
      ).toBeUndefined();
    });

    it("doRefer - event reference", () => {
      extern.isEventReference = fn().mockReturnValue(true) as any;
      const cur = new TestDocument(' <input value="bar">');
      const eventResolver = ({ event_definitions }: Document) =>
        event_definitions;
      expect(
        cur.doRefer(
          eventResolver,
          ({ state_definitions }) => state_definitions,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 16 } as Position
        )
      ).toMatchObject(["mock-loc"]);
      expect(extern.getLocations).toBeCalledWith("bar", eventResolver);
    });

    it("doRefer - state reference", () => {
      extern.isStateReference = fn().mockReturnValue(true) as any;
      const cur = new TestDocument(' <input value="bar">');
      const stateResolver = ({ state_definitions }: Document) =>
        state_definitions;
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          stateResolver,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 16 } as Position
        )
      ).toMatchObject(["mock-loc"]);
      expect(extern.getLocations).toBeCalledWith("bar", stateResolver);
    });

    it("doRefer - result reference", () => {
      extern.isResultReference = fn().mockReturnValue(true) as any;
      const cur = new TestDocument(' <input value="bar">');
      const resultResolver = ({ result_definitions }: Document) =>
        result_definitions;
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          ({ state_definitions }) => state_definitions,
          resultResolver,
          { line: 0, character: 16 } as Position
        )
      ).toMatchObject(["mock-loc"]);
      expect(extern.getLocations).toBeCalledWith("bar", resultResolver);
    });

    it("doRefer - no value", () => {
      const cur = new TestDocument(' <input value="">');
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          ({ state_definitions }) => state_definitions,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 15 } as Position
        )
      ).toBeUndefined();
      expect(extern.getLocations).not.toBeCalled();
    });

    it("doRefer - event definition", () => {
      extern.isEventDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument(' <input value="bar">');
      const eventResolver = ({ event_definitions }: Document) =>
        event_definitions;
      expect(
        cur.doRefer(
          eventResolver,
          ({ state_definitions }) => state_definitions,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 16 } as Position
        )
      ).toMatchObject(["mock-loc"]);
      expect(extern.getLocations).toBeCalledWith("bar", eventResolver);
    });

    it("doRefer - state definition", () => {
      extern.isStateDefinition = fn().mockReturnValue(true);
      const cur = new TestDocument(' <input value="bar">');
      const stateResolver = ({ state_definitions }: Document) =>
        state_definitions;
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          stateResolver,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 16 } as Position
        )
      ).toMatchObject(["mock-loc"]);
      expect(extern.getLocations).toBeCalledWith("bar", stateResolver);
    });

    it("doRefer - result definition", () => {
      extern.isResultDefinition = fn().mockReturnValue(true) as any;
      const cur = new TestDocument(' <input value="bar">');
      const resultResolver = ({ result_definitions }: Document) =>
        result_definitions;
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          ({ state_definitions }) => state_definitions,
          resultResolver,
          { line: 0, character: 16 } as Position
        )
      ).toMatchObject(["mock-loc"]);
      expect(extern.getLocations).toBeCalledWith("bar", resultResolver);
    });

    it("doRefer - unknown", () => {
      const cur = new TestDocument(' <input value="bar">');
      expect(
        cur.doRefer(
          ({ event_definitions }) => event_definitions,
          ({ state_definitions }) => state_definitions,
          ({ result_definitions }) => result_definitions,
          { line: 0, character: 16 } as Position
        )
      ).toBeUndefined();
    });
  });
}
/* v8 ignore stop */
