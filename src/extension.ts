import { matchesGlob } from "node:path";
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  ConfigurationChangeEvent,
  DefinitionProvider,
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  DiagnosticTag,
  Disposable,
  ExtensionContext,
  extensions,
  FileCreateEvent,
  FileDeleteEvent,
  FileRenameEvent,
  FileSystemWatcher,
  Hover,
  HoverProvider,
  languages,
  Location,
  MarkdownString,
  Position,
  Range,
  ReferenceProvider,
  SnippetString,
  TextDocument,
  TextDocumentChangeEvent,
  TextEdit,
  Uri,
  workspace,
} from "vscode";
import {
  getDefaultHTMLDataProvider,
  getLanguageService,
  HTMLDataV1,
  HTMLDocument,
  IAttributeData,
  IHTMLDataProvider,
  InsertTextFormat,
  InsertTextMode,
  IValueData,
  CompletionItem as LSCompletionItem,
  Hover as LSHover,
  Position as LSPosition,
  Range as LSRange,
  TextDocument as LSTextDocument,
  TextEdit as LSTextEdit,
  MarkedString,
  MarkupContent,
  MarkupKind,
  newHTMLDataProvider,
  Node,
  TokenType,
} from "vscode-html-languageservice";

// #region Interfaces

interface ParsedDocument {
  doc: TextDocument;
  textDoc: LSTextDocument;
  htmlDoc: HTMLDocument;
  event_definitions: Map<string, Range[]>;
  event_references: Map<string, Range[]>;
  state_definitions: Map<string, Range[]>;
  state_references: Map<string, Range[]>;
  result_definitions: Map<string, Range[]>;
  result_references: Map<string, Range[]>;
  diagnostics: Diagnostic[];
}

interface Attr {
  name: string;
  value: string;
  offset: number;
  end: number;
  range: Range;
  fullRange: Range;
}

interface ParsedToken {
  token: string;
  characterDelta: number;
}

type DocumentationItem<T> = T extends MarkupContent
  ? T["kind"] extends typeof MarkupKind.Markdown
    ? MarkdownString
    : string
  : T extends { language: string; value: string }
  ? MarkdownString
  : T extends string
  ? string
  : never;

type Documentation<T> = T extends (infer I)[]
  ? DocumentationItem<I>[]
  : DocumentationItem<T>;

// #endregion

// #region Data

let currentAttributes: Record<string, string | null>;
let exclude: string[];
let include: string[];
let languageIds: string[];
let actionUndefinedSeverity: DiagnosticSeverity | undefined;
let actionUnusedSeverity: DiagnosticSeverity | undefined;
let fileExtensions: string[];
let fileExtensionGlob: string | null;
let watcher: FileSystemWatcher;
let diagnosticCollection: DiagnosticCollection;
const languageDisposables = new Map<string, Disposable[]>();

const docs = new Map<string, ParsedDocument>();
const HEAD_PATTERN = /^(?:\s*["'])?/;
const TAIL_PATTERN = /(?:["']\s*)?$/;
const END_SPACE_PATTERN = /(?:^\s|\s$)/;
const INVALID_PATTERN = /[\(\)\[\]\<\>\{\}]/g;
const customEvents = ["conceal", "navigate", "result", "reveal"];
const valueTags = ["input", "select", "textarea"];
const validityTags = valueTags.concat([
  "form",
  "button",
  "output",
  "object",
  "fieldset",
]);
const onDependentAttributes = [
  "debounce",
  "throttle",
  "credentials",
  "result",
  "error",
  "redirect",
  "once",
  "if:loading",
  "if:error",
  "get",
  "post",
  "put",
  "delete",
];
const validPosition = [
  "replaceChildren",
  "replaceWith",
  "before",
  "after",
  "prepend",
  "append",
];
const onDependentTags = new Map([
  ["href", ["base", "link", "a"]],
  ["action", ["form"]],
  [
    "src",
    [
      "img",
      "iframe",
      "embed",
      "video",
      "audio",
      "source",
      "track",
      "input",
      "script",
    ],
  ],
  ["method", ["form"]],
  [
    "name",
    [
      "meta",
      "iframe",
      "object",
      "param",
      "map",
      "form",
      "input",
      "button",
      "select",
      "textarea",
      "output",
      "fieldset",
      "slot",
    ],
  ],
  [
    "value",
    ["li", "param", "input", "button", "option", "progress", "meter", "data"],
  ],
]);
const methods = {
  GET: ["href", "action", "src", "get"],
  POST: ["post"],
  PUT: ["put"],
  DELETE: ["delete"],
};
const severityMap = new Map([
  ["Error", DiagnosticSeverity.Error],
  ["Warning", DiagnosticSeverity.Warning],
  ["Information", DiagnosticSeverity.Information],
  ["Hint", DiagnosticSeverity.Hint],
]);

// #endregion

// #region Utilities

function* combineIterators<T>(...args: IterableIterator<T>[]) {
  for (const iter of args) {
    yield* iter;
  }
}

const isEventDefinition = (name: string) =>
  name.startsWith("on:") || name.startsWith("x-on:");

const isEventReference = (name: string) =>
  name === "on" || name === "x-on" || name === "reset" || name === "x-reset";

const isEventFilter = (name: string) =>
  name.startsWith("event:") || name.startsWith("x-event:");

const isStateDefinition = (name: string) =>
  name.startsWith("if:") || name.startsWith("x-if:");

const isStateReference = (name: string) => name === "if" || name === "x-if";

const isResultDefinition = (name: string) =>
  name === "result" ||
  name === "x-result" ||
  name === "error" ||
  name === "x-error";

const isResultReference = (name: string) =>
  name === "render" || name === "x-render";

const isOnDependent = (name: string) =>
  name.startsWith("h-") ||
  onDependentAttributes.includes(name) ||
  (name.startsWith("x-") && onDependentAttributes.includes(name.slice(2)));

const isPosition = (name: string) =>
  name === "position" || name === "x-position";

const isTagOnDependent = (tag: string, name: string) => {
  if (isOnDependent(name)) {
    return true;
  }

  let tags = onDependentTags.get(name);
  if (tags) {
    return !tags.includes(tag);
  }

  if (name.startsWith("x-") && (tags = onDependentTags.get(name.slice(2)))) {
    return !tags.includes(tag);
  }

  return false;
};

const getEventDefinitions = ({ event_definitions }: ParsedDocument) =>
  event_definitions;

const getEventReferences = ({ event_references }: ParsedDocument) =>
  event_references;

const getStateDefinitions = ({ state_definitions }: ParsedDocument) =>
  state_definitions;

const getStateReferences = ({ state_references }: ParsedDocument) =>
  state_references;

const getResultDefinitions = ({ result_definitions }: ParsedDocument) =>
  result_definitions;

const getResultReferences = ({ result_references }: ParsedDocument) =>
  result_references;

const match = (path: string, exclude: string[], include: string[]) => {
  for (let pattern of exclude) {
    if (matchesGlob(path, pattern)) {
      for (pattern of include) {
        if (matchesGlob(path, pattern)) {
          return true;
        }
      }
      return false;
    }
  }
  return true;
};

const t = <T extends string>(
  strings: TemplateStringsArray,
  ...placeholders: T[]
) => {
  const len = strings.length + placeholders.length;
  const result = new Array(len);
  let i;

  for (i = 0; i < len; i += 2) {
    result[i] = strings[i >> 1];
  }

  return <R>(values: Record<T, R>) => {
    for (i = 1; i < len; i += 2) {
      result[i] = values[placeholders[i >> 1]!];
    }

    return result.join("");
  };
};

const mergeDefinition = <T extends Record<string, any>>(
  left: T,
  right: T
): T => {
  const result = { ...left };
  let el;

  for (const key in right) {
    el = right[key];
    result[key] =
      el == null || typeof el !== "object" || typeof left[key] !== typeof el
        ? el
        : Array.isArray(el)
        ? (mergeDefinitions(left[key], el) as any)
        : mergeDefinition(left[key], el);
  }

  return result;
};

const mergeDefinitions = <T extends Record<string, any>>(
  left: T[],
  right: T[]
): T[] => {
  const result = left.slice();
  const lLen = left.length;
  const rLen = right.length;

  for (let r = 0, l, el; r < rLen; ++r) {
    el = right[r]!;
    l = lLen;
    while (l--) {
      if (left[l]!["name"] === el["name"]) {
        break;
      }
    }
    if (l === -1) {
      result.push(el);
    } else {
      result.splice(l, 1, mergeDefinition(left[l]!, el));
    }
  }

  return result;
};

const convertPosition = (pos: LSPosition) =>
  new Position(pos.line, pos.character);

const convertRange = (range: LSRange) =>
  new Range(convertPosition(range.start), convertPosition(range.end));

const convertTextEdit = ({ range, newText }: LSTextEdit) =>
  new TextEdit(convertRange(range), newText);

const convertDocumentation = <
  T extends MarkupContent | MarkedString | (MarkupContent | MarkedString)[]
>(
  documentation: T
): Documentation<T> => {
  if (Array.isArray(documentation)) {
    return documentation.map(convertDocumentation) as Documentation<
      typeof documentation
    >;
  }
  if (typeof documentation === "string") {
    return documentation as unknown as Documentation<typeof documentation>;
  }
  if (MarkupContent.is(documentation)) {
    if (documentation.kind === MarkupKind.Markdown) {
      return new MarkdownString(documentation.value) as Documentation<
        typeof documentation
      >;
    }
    return documentation.value as Documentation<typeof documentation>;
  }
  return new MarkdownString().appendCodeblock(
    documentation.value,
    documentation.language
  ) as Documentation<typeof documentation>;
};

const convertHover = ({ contents, range }: LSHover) =>
  range
    ? new Hover(convertDocumentation(contents), convertRange(range))
    : new Hover(convertDocumentation(contents));

const convertCompletionItem = ({
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
    item.range = LSTextEdit.is(textEdit)
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

// #endregion

// #region Aggregator

function* parseNodeAttrs(
  textDoc: LSTextDocument,
  { start, startTagEnd, tag, attributes }: Node
): Generator<Attr> {
  if (!startTagEnd || !tag || !attributes) {
    return;
  }

  const text = textDoc.getText();
  const scanner = service.createScanner(text, start);
  let tokenEnd = -1;
  let token, name, nameOffset, tokenOffset, tokenText, head, tail, offset, end;

  while (tokenEnd < startTagEnd && (token = scanner.scan()) !== TokenType.EOS) {
    tokenEnd = scanner.getTokenEnd();
    if (token === TokenType.AttributeName) {
      name = scanner.getTokenText();
      nameOffset = scanner.getTokenOffset();
    } else if (name && nameOffset && token === TokenType.AttributeValue) {
      tokenOffset = scanner.getTokenOffset();
      tokenText = scanner.getTokenText();
      head = HEAD_PATTERN.exec(tokenText)![0].length;
      tail = TAIL_PATTERN.exec(tokenText)![0].length * -1;
      offset = tokenOffset + head;
      end = tokenEnd + tail;

      yield {
        name,
        value: tokenText.slice(head, tail),
        offset,
        end,
        range: new Range(
          convertPosition(textDoc.positionAt(offset)),
          convertPosition(textDoc.positionAt(end))
        ),
        fullRange: new Range(
          convertPosition(textDoc.positionAt(nameOffset)),
          convertPosition(textDoc.positionAt(tokenEnd))
        ),
      };
      name = undefined;
    }
  }
}

const getAttrAtOffset = (
  textDoc: LSTextDocument,
  node: Node,
  offset: number
) => {
  for (const attribute of parseNodeAttrs(textDoc, node)) {
    if (offset >= attribute.offset && offset <= attribute.end) {
      return attribute;
    }
  }
  return;
};

const parse_tokens = (input: string) => {
  const result: ParsedToken[] = [];
  const len = input.length;
  const matches = Array.from(input.matchAll(INVALID_PATTERN));
  const first = matches[0];
  let i = 0;
  let characterDelta = -1;
  let leftBoundary = len;
  let rightBoundary = -1;

  if (first) {
    leftBoundary = input.lastIndexOf(" ", first.index);
    rightBoundary = input.indexOf(" ", matches[matches.length - 1]!.index);
    if (rightBoundary === -1) {
      rightBoundary = len;
    }
  }

  for (; i < len; ++i) {
    if (i > leftBoundary && i < rightBoundary) {
      characterDelta = -1;
    } else {
      if (input.charCodeAt(i) === 32) {
        if (characterDelta !== -1) {
          result.push({
            token: input.slice(characterDelta, i),
            characterDelta,
          });
          characterDelta = -1;
        }
      } else if (characterDelta === -1) {
        characterDelta = i;
      }
    }
  }

  if (characterDelta !== -1) {
    result.push({ token: input.slice(characterDelta, i), characterDelta });
  }

  return result;
};

const addRange = (store: Map<string, Range[]>, key: string, range: Range) => {
  if (key) {
    store.get(key)?.push(range) ?? store.set(key, [range]);
  }
};

const addDefinitionRanges = (
  store: Map<string, Range[]>,
  value: string,
  range: Range
) => {
  for (const { token, characterDelta } of parse_tokens(value)) {
    addRange(
      store,
      token,
      range.with({
        start: range.start.translate({ characterDelta }),
        end: range.start.translate({
          characterDelta: characterDelta + token.length,
        }),
      })
    );
  }
};

const DEP_TPL = t`'${"name"}' without ${"article"} '${"depends"}' (or 'x-${"depends"}') does nothing.`;

const addDependsDiagnostic = (
  diagnostics: Diagnostic[],
  attributes: Record<string, string | null>,
  range: Range,
  name: string,
  depends: string,
  article = "a"
) => {
  if (depends in attributes || `x-${depends}` in attributes) {
    return;
  }
  const diagnostic = new Diagnostic(
    range,
    DEP_TPL({ name, article, depends }),
    DiagnosticSeverity.Warning
  );
  diagnostic.source = "KEML";
  diagnostic.tags = [DiagnosticTag.Unnecessary];
  diagnostics.push(diagnostic);
};

const traverse = (
  textDoc: LSTextDocument,
  node: Node,
  event_definitions: Map<string, Range[]>,
  event_references: Map<string, Range[]>,
  state_definitions: Map<string, Range[]>,
  state_references: Map<string, Range[]>,
  result_definitions: Map<string, Range[]>,
  result_references: Map<string, Range[]>,
  diagnostics: Diagnostic[]
) => {
  const { attributes = {}, children, tag } = node;
  let diagnostic;

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
      addDependsDiagnostic(diagnostics, attributes, fullRange, name, "render");
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
  for (const child of children) {
    traverse(
      textDoc,
      child,
      event_definitions,
      event_references,
      state_definitions,
      state_references,
      result_definitions,
      result_references,
      diagnostics
    );
  }
};

const parseHTMLDocument = (
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

  for (const root of htmlDoc.roots) {
    traverse(
      textDoc,
      root,
      event_definitions,
      event_references,
      state_definitions,
      state_references,
      result_definitions,
      result_references,
      diagnostics
    );
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

const addPartialReferenceDiagnostics = <T extends "event" | "state" | "result">(
  diagnostics: Diagnostic[],
  cur: ParsedDocument,
  left: (cur: ParsedDocument) => Map<string, Range[]>,
  right: (cur: ParsedDocument) => Map<string, Range[]>,
  kind: T,
  tpl: (scope: { kind: T; action: string }) => string,
  severity: DiagnosticSeverity,
  tags?: DiagnosticTag[]
) => {
  let found, ref, range, diagnostic;

  for (const [action, ranges] of left(cur)) {
    found = false;
    for (ref of docs.values()) {
      if (right(ref).has(action)) {
        found = true;
        break;
      }
    }
    if (!found) {
      for (range of ranges) {
        diagnostic = new Diagnostic(range, tpl({ kind, action }), severity);
        diagnostic.source = "KEML";
        if (tags) {
          diagnostic.tags = tags;
        }
        diagnostics.push(diagnostic);
      }
    }
  }
};

const UNUSED_TPL = t`'${"action"}' ${"kind"} action is declared but its value is never read.`;
const UNDECLARED_TPL = t`Cannot find ${"kind"} action '${"action"}'.`;

const addReferenceDiagnostics = (
  diagnostics: Diagnostic[],
  cur: ParsedDocument,
  definitionResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  referenceResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  kind: "event" | "state" | "result"
) => {
  if (actionUnusedSeverity != null) {
    addPartialReferenceDiagnostics(
      diagnostics,
      cur,
      definitionResolver,
      referenceResolver,
      kind,
      UNUSED_TPL,
      actionUnusedSeverity,
      actionUnusedSeverity === DiagnosticSeverity.Warning
        ? [DiagnosticTag.Unnecessary]
        : undefined
    );
  }
  if (actionUndefinedSeverity != null) {
    addPartialReferenceDiagnostics(
      diagnostics,
      cur,
      referenceResolver,
      definitionResolver,
      kind,
      UNDECLARED_TPL,
      actionUndefinedSeverity
    );
  }
};

const createDiagnosticCollection = () => {
  diagnosticCollection.clear();

  let diagnostics: Diagnostic[];

  for (const cur of docs.values()) {
    diagnostics = [];
    addReferenceDiagnostics(
      diagnostics,
      cur,
      getEventDefinitions,
      getEventReferences,
      "event"
    );
    addReferenceDiagnostics(
      diagnostics,
      cur,
      getStateDefinitions,
      getStateReferences,
      "state"
    );
    addReferenceDiagnostics(
      diagnostics,
      cur,
      getResultDefinitions,
      getResultReferences,
      "result"
    );
    diagnosticCollection.set(cur.doc.uri, diagnostics.concat(cur.diagnostics));
  }
};

const setDocs = (doc: TextDocument, overwrite: boolean) => {
  const { uri, version, languageId } = doc;
  const url = uri.toString();

  if (docs.has(url) !== overwrite) {
    return;
  }

  if (
    !languageIds.includes(languageId) ||
    !match(uri.fsPath, exclude, include)
  ) {
    return;
  }

  const textDoc = LSTextDocument.create(url, "html", version, doc.getText());

  docs.set(url, parseHTMLDocument(doc, textDoc));
  createDiagnosticCollection();
};

const onDidChangeDoc = (doc: TextDocument) => setDocs(doc, true);

const onDidCreateDoc = (doc: TextDocument) => setDocs(doc, false);

const onDidChange = (uri: Uri) =>
  workspace.openTextDocument(uri).then(onDidChangeDoc);

const onDidCreate = (uri: Uri) =>
  workspace.openTextDocument(uri).then(onDidCreateDoc);

const onDidDelete = (uri: Uri) => {
  docs.delete(uri.toString());
  createDiagnosticCollection();
};

const onDidRename = async ({
  oldUri,
  newUri,
}: {
  oldUri: Uri;
  newUri: Uri;
}) => {
  const oldUrl = oldUri.toString();
  const newUrl = newUri.toString();
  const cur = docs.get(oldUrl);

  if (!cur) {
    return;
  }

  cur.doc = await workspace.openTextDocument(newUri);

  docs.delete(oldUrl);
  docs.set(newUrl, cur);
  createDiagnosticCollection();
};

const onDidChangeConfiguration = (e: ConfigurationChangeEvent) =>
  !e.affectsConfiguration("keml") ||
  !e.affectsConfiguration("search") ||
  init();

const onDidChangeTextDocument = ({
  document,
  contentChanges,
}: TextDocumentChangeEvent) => {
  const url = document.uri.toString();
  const cur = docs.get(url);

  if (!cur || !contentChanges.length) {
    return;
  }

  const textDoc = LSTextDocument.update(
    cur.textDoc,
    Array.from(contentChanges),
    document.version
  );
  docs.set(url, parseHTMLDocument(document, textDoc));
  createDiagnosticCollection();
};

const onDidCreateFiles = ({ files }: FileCreateEvent) =>
  files.forEach(onDidCreate);

const onDidDeleteFiles = ({ files }: FileDeleteEvent) =>
  files.forEach(onDidDelete);

const onDidRenameFiles = ({ files }: FileRenameEvent) =>
  files.forEach(onDidRename);

const registerCompletionItemProvider = (languageId: string) =>
  languages.registerCompletionItemProvider(languageId, completionProvider, " ");

const registerDefinitionProvider = (languageId: string) =>
  languages.registerDefinitionProvider(languageId, definitionProvider);

const registerReferenceProvider = (languageId: string) =>
  languages.registerReferenceProvider(languageId, referenceProvider);

const registerHoverProvider = (languageId: string) =>
  languages.registerHoverProvider(languageId, hoverProvider);

const createFileSystemWatcher = () => {
  if (watcher) {
    watcher.dispose();
  }
  if (fileExtensionGlob) {
    watcher = workspace.createFileSystemWatcher(fileExtensionGlob);
    watcher.onDidChange(onDidChange);
    watcher.onDidCreate(onDidCreate);
    watcher.onDidDelete(onDidDelete);
  }
};

const init = async () => {
  const excludes = workspace
    .getConfiguration("search")
    .get<Record<string, boolean>>("exclude", {});
  const keml = workspace.getConfiguration("keml");
  let languages: { id: string; extensions?: string[] }[] | undefined;
  let packageJSON, id, exts, ext, disposable, languageId, disposables;

  exclude = [];
  include = keml.get<string[]>("include", []);
  languageIds = keml.get<string[]>("languageIds", ["html"]);
  actionUndefinedSeverity = severityMap.get(
    keml.get<string>("actionUndefinedSeverity", "Error")
  );
  actionUnusedSeverity = severityMap.get(
    keml.get<string>("actionUnusedSeverity", "Error")
  );
  fileExtensions = [];

  for (const pattern in excludes) {
    if (excludes[pattern]) {
      exclude.push(pattern);
    }
  }

  for ({ packageJSON } of extensions.all) {
    if ((languages = packageJSON?.contributes?.languages)) {
      for ({ id, extensions: exts } of languages) {
        if (exts && languageIds.includes(id)) {
          for (ext of exts) {
            if (ext.charCodeAt(0) === 46) {
              ext = ext.slice(1);
            }
            fileExtensions.push(ext);
          }
        }
      }
    }
  }

  fileExtensionGlob = fileExtensions.length
    ? `**/*.{${fileExtensions.join(",")}}`
    : null;

  for (const [url, cur] of docs) {
    if (
      !languageIds.includes(cur.doc.languageId) ||
      !match(cur.doc.uri.fsPath, exclude, include)
    ) {
      docs.delete(url);
    }
  }

  for ([languageId, disposables] of Array.from(languageDisposables)) {
    if (!languageIds.includes(languageId)) {
      for (disposable of disposables) {
        disposable.dispose();
      }
      languageDisposables.delete(languageId);
    }
  }

  workspace.textDocuments.forEach(onDidCreateDoc);

  if (fileExtensionGlob) {
    const files = await workspace.findFiles(fileExtensionGlob);
    await Promise.all(files.map(onDidCreate));
  }

  createDiagnosticCollection();
  createFileSystemWatcher();

  for (languageId of languageIds) {
    if (!languageDisposables.has(languageId)) {
      languageDisposables.set(languageId, [
        registerCompletionItemProvider(languageId),
        registerDefinitionProvider(languageId),
        registerReferenceProvider(languageId),
        registerHoverProvider(languageId),
      ]);
    }
  }
};

// #endregion

// #region Service

const CUSTOM_EVENT_DESCRIPTIONS: Record<string, string> = {
  reveal: `* Triggered when an element becomes **visible in the viewport**.
* Fires on initial page load if the element is already visible.
* Fires again whenever the element enters the viewport after scrolling.`,
  conceal: `* Triggered when an element **leaves the viewport** after scrolling.
* Complements \`reveal\`, allowing visibility-based behaviors.`,
  navigate: `* Triggered on **browser history changes** via the History API.
* Useful for responding to in-app navigation without a full page reload.`,
  result: `* Triggered **after a successful request and render of a response**.
* Fires once the new content is fully rendered and all elements with declared
  actions are ready to run.
* Even actions on elements rendered dynamically through this response will fire
  correctly.
* Useful for chaining actions after dynamic updates.`,
};

const getEventAttrs = (name: string): IAttributeData[] => [
  {
    name: `on:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`on:${name}\`

${
  CUSTOM_EVENT_DESCRIPTIONS[name] ??
  `* Behaves like the native \`${name}\` event.`
}
* Declares a **list of named actions** to run when the event fires.
  * Actions are **names**, not arbitrary JavaScript code.
  * Names can be **reused** across your KEML project.
* Supports **space-separated action names**.
  * All listed actions run in order when triggered.
* May be gated by a companion **\`event:${name}\` filter** — if conditions don't
  match, no actions fire.

💡 Actions declared here are the **source**; other attributes like \`on\` and
\`reset\` can **reference them**.

Example:
\`\`\`html
<button on:click="save highlight" event:click="ctrlKey">
  Save with Ctrl+Click
</button>
\`\`\`
→ Runs \`save\` and \`highlight\` actions only if **Ctrl** is pressed when
  clicking.`,
    },
  },
  {
    name: `event:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`event:${name}\`

* Defines **conditions** that must be satisfied for \`on:${name}\` actions to
  fire.
* Accepts a **comma-separated list** of \`key=value\` pairs.

Condition rules:
1. \`key=value\` → matches when \`String(event[key]) === String(value)\`
   * Whitespace around \`=\` or the value is ignored
     → \`key=value\`, \`key = value\`, \`key=   value\` are equivalent
2. \`key\` (no \`=\`) → matches when \`!!event[key]\` is truthy
3. \`key=\` (empty value) → matches when \`String(event[key]) === ""\`

* If **all pairs match**, the actions fire.
* If **any pair fails**, the actions are skipped.

💡 Useful for hotkeys and modifiers. Example:
\`event:keydown="ctrlKey, key=a"\`
→ fires only when **Ctrl+A** is pressed.`,
    },
  },
];

const getEndpointAttr =
  (method: string) =>
  (name: string): IValueData => ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`${name}\`

* Configures the **endpoint route** for this element.
* Paths are resolved relative to the current page URL
  (example: https://example.com/blog/posts/):
  * "new" → https://example.com/blog/posts/new/
  * "../archive" → https://example.com/blog/archive/
  * "/home" → https://example.com/home/
  * "index.html" → https://example.com/blog/posts/index.html
* **Trailing slashes are enforced automatically**:
  * File paths → no trailing slash
  * Other paths → single trailing slash added
* By default, requests to this endpoint use the **${method}** HTTP method.
  * Can be overridden with the \`method\` attribute.`,
    },
  });

const getMethodValue = (name: string): IValueData => ({
  name,
  description: {
    kind: MarkupKind.Markdown,
    value: `**Value**: \`${name}\`

* Can be used as a value for the \`method\` attribute on elements with an \`on\`
  attribute.
* Overrides the HTTP method used for the request triggered by the element.
* Method determination follows this order:
  1. Default is \`GET\`.
  2. Attributes \`post\`, \`put\`, or \`delete\` are checked **in order**, and
     the **first one found** overrides the default.
  3. The \`method\` attribute, if present, **finally overrides** any previous
     determination.

💡 Example:
\`\`\`html
<input on="loadData" src="/todos" method="${name}">
\`\`\`
→ The request triggered by this element uses the ${name} method.`,
  },
});

const getEventValue = (name: string) =>
  ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Event Action**: \`${name}\`

* Can be used as a value for \`on:<event>\`, \`on\`, or \`reset\` attributes.
* Represents a **named signal**: initiating it does nothing by itself, but any
  subscribed element can respond.
* Multiple elements can trigger the same action, and multiple elements can
  subscribe to it.
* Actions are **global on the page**; all subscribers respond when it is
  triggered.

💡 Example:
\`\`\`html
<button on:click="${name}">Trigger</button>
<div on="${name}" get="/data"></div>
<form reset="${name}"></form>
\`\`\`

→ Clicking the button triggers the \`${name}\` action.${"  "}
→ The \`div\` sends a request to \`/data\`.${"  "}
→ The \`form\` resets itself.`,
    },
  } satisfies IValueData);

const getStateValue = (name: string) =>
  ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**State Action**: \`${name}\`

* Can be used as a value for \`if\`, \`if:loading\`, \`if:error\`,
  \`if:invalid\`, \`if:value\`, or \`if:intersects\` attributes on elements.
* Represents a **boolean state flag** that is turned ON or OFF in response to
  actions, form validity, input values, visibility, or request results.
* Multiple elements can subscribe to the same state action and update their
  attributes differently using \`x-\` prefixed attributes.
* By default, a state is OFF. Subscribed elements react automatically when it
  changes.

💡 Example:
\`\`\`html
<button get="/data" if:loading="${name}" on="loadData" on:click="loadData">
  Load
</button>
<div if="${name}" x-style="display: none">not loading</div>
<div if="${name}" style="display: none" x-style>loading</div>
\`\`\`

→ Clicking the button turns ON the \`${name}\` state, updating the divs'
  visibility.${"  "}
→ After the request completes, the state turns OFF and the divs revert.`,
    },
  } satisfies IValueData);

const getResultValue = (name: string) =>
  ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Result Action**: \`${name}\`

* Can be used as a value for \`result\`, \`error\`, or \`render\` attributes.
  - \`result\` and \`error\` define a result action on an element that performs
    a request (for successful or failed responses, respectively).
  - \`render\` subscribes an element to a result action to display the server
    response.
* Multiple elements can define or subscribe to the same result action.
* The \`position\` attribute controls how the response is applied to the
  subscribing element.

💡 Example:
\`\`\`html
<button
  get="/user-count"
  on="getUserCount"
  on:click="getUserCount"
  result="${name}"
>Click me</button>
<div render="${name}"></div>
<span position="replaceWith" render="${name}"></span>
\`\`\`

→ The button defines the \`${name}\` result action.${"  "}
→ The \`div\` and \`span\` subscribe to it and render the server response
  according to their \`position\`.`,
    },
  } satisfies IValueData);

const getExistingActionValue = (
  name: string,
  definitionsGetter: (cur: ParsedDocument) => Map<string, Range[]>,
  valueGetter: (name: string) => ReturnType<typeof getStateValue>
) => {
  for (const cur of docs.values()) {
    if (definitionsGetter(cur).has(name)) {
      return valueGetter(name);
    }
  }
  return;
};

const getEndpointAttrs = ([method, names]: [string, string[]]) =>
  names.map(getEndpointAttr(method));

const customData: HTMLDataV1 = {
  version: 1.1,
  globalAttributes: customEvents
    .flatMap(getEventAttrs)
    .concat(Object.entries(methods).flatMap(getEndpointAttrs), [
      {
        name: "on",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`on\`

* Subscribes the element to a **named event action**.
* The action may be triggered by this element or any other element on the page.
* Multiple elements can subscribe to the same event action.
* When triggered, the element performs its default behavior (e.g., sends a
  request or executes other KEML-defined effects) if applicable.

💡 Example:
\`\`\`html
<button on:click="save">Save</button>
<div on="save"></div>
\`\`\`
→ Clicking the button triggers the \`save\` event action on the div.`,
        },
      },
      {
        name: "reset",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`reset\`

Subscribes the element to a single action, just like \`on\`, but instead of
sending a request or performing a redirect, it calls the element's \`reset()\`
method.

- Can be used on forms, form fields, or any element that implements a compatible
  \`reset(): void\` method.
- The reset happens **immediately**, without being affected by \`debounce\` or
  \`throttle\`.
- Works with any action, including those initiated by other elements.

💡 Example:
\`\`\`html
<button on:click="resetForm">click me</button>
<form reset="resetForm"></form>
\`\`\`
`,
        },
      },
      {
        name: "render",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`render\`

* Subscribes the element to a **result action** initiated by another element's
  network request.
* Can be used on any element, including the one that triggered the request.
* When the specified action fires, this element will update its contents
  according to the server response.
* Useful for responding to \`result\` or \`error\` actions triggered by other
  elements.
* Multiple elements subscribing to the same result action will render the
  **same server response**.

💡 Example:
\`\`\`html
<div render="userCount"></div>
\`\`\`
`,
        },
      },
      {
        name: "key",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`key\`

* Uniquely identifies an element among its **sibling DOM elements**.
* Helps the renderer efficiently update the DOM by minimizing unnecessary
  re-renders.
* Especially useful for elements whose positions or order may change between
  server responses.
  * If sibling elements are all identical in shape, keys are generally
    unnecessary even if their order changes.
* Keys do **not** need to be globally unique, only unique among sibling
  elements.

💡 Example:
\`\`\`html
<div key="notification" class="info">Notification text</div>
<table key="table">
  <!-- heavy DOM with many rows -->
</table>
\`\`\`
→ These keys allow the renderer to recognize the same elements between
  responses, improving performance when sibling elements differ.`,
        },
      },
      {
        name: "if:intersects",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:intersects\`

* Can be used on **any element**.
* Subscribes the element to a **state action** that turns ON when the element
  **intersects the viewport** and OFF when it leaves the viewport.
* Any attribute prefixed with \`x-\` will be applied when the state is ON and
  reverted when the state is OFF.

💡 Example:
\`\`\`html
<p if:intersects="canSee"></p>
<br>
<br>
<br>
<div if="canSee" x-style="display: none">out of viewport</div>
<div if="canSee" style="display: none" x-style>in the viewport</div>
\`\`\`
→ The first div is visible when the paragraph is out of view, and the second div
  is visible when it intersects the viewport.`,
        },
      },
      {
        name: "if:loading",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:loading\`

* Can only be used on elements that **send requests**
  (have an \`on\` attribute).
* Declares one or more **state actions** to turn ON immediately **before** a
  request starts, and OFF immediately **after** the request completes.
* Supports **space-separated state action names**.
* Other elements can subscribe to these state actions using the \`if\`
  attribute.
* Any attribute prefixed with \`x-\` on subscriber elements will temporarily
  override the normal value while the state is ON.

💡 Example:
\`\`\`html
<input on="loadData" get="/data" if:loading="isLoading">
<div if="isLoading" x-style="opacity: 0.5">Loading...</div>
\`\`\`
→ The \`isLoading\` state turns ON before the request and OFF after it
  completes, temporarily applying the reactive attributes on subscriber
  elements.`,
        },
      },
      {
        name: "if:error",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:error\`

* Can only be used on elements that **send requests**
  (have an \`on\` attribute).
* Declares one or more **state actions** to turn OFF immediately **before** a
  request starts, and ON if the request **fails** (status ≥ 400).
* Supports **space-separated state action names**.
* Other elements can subscribe to these state actions using the \`if\`
  attribute.
* Any attribute prefixed with \`x-\` on subscriber elements will temporarily
  override the normal value while the state is ON.

💡 Example:
\`\`\`html
<input on="loadData" get="/non-existent" if:error="isError">
<div if="isError" x-style="color: red">Error occurred</div>
\`\`\`
→ The \`isError\` state turns ON if the request fails, temporarily applying
  reactive attributes on subscriber elements.`,
        },
      },
      {
        name: "if",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if\`

* Can be used on **any element**.
* Subscribes the element to a **single state action**, including ones triggered
  by the same element.
* Any attribute prefixed with \`x-\` will be applied when the state is ON and
  reverted when the state is OFF.

💡 Example:
\`\`\`html
<button if="isActive" x-style="opacity: 0.5">Click me</button>
<div if="isActive" style="display: none" x-style>Active</div>
\`\`\`
→ Both elements respond to the \`isActive\` state action: the button changes
  style and the div toggles visibility when the state is ON.`,
        },
      },
      {
        name: "position",
        valueSet: "position",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`position\`

* Controls **how an element renders** the server response when subscribed to a
  result action.
* Can be used on any element with a \`render\` attribute.
* Determines which part of the DOM is replaced or where the response is
  inserted.

⚙️ Available values:
- \`replaceChildren\` (default) → replaces all of the element's children with
  the server response.
- \`replaceWith\` → replaces the element itself with the server response.
- \`before\` → inserts the server response directly **before** the element.
- \`after\` → inserts the server response directly **after** the element.
- \`prepend\` → prepends the server response as the **first child** of the
  element.
- \`append\` → appends the server response as the **last child** of the element.

💡 Example:
\`\`\`html
<span position="replaceWith" render="userCount"></span>
<div position="prepend" render="userCount"></div>
\`\`\`
→ The span replaces itself and the div prepends the same server response
  whenever the \`userCount\` action fires.`,
        },
      },
      {
        name: "debounce",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`debounce\`

* Specifies a **delay in milliseconds** for this element to respond to an event
  action.
* While debounced, repeated triggers of the same action on this element are
  ignored until the delay expires.
* Useful for preventing rapid repeated requests.

💡 Example:
\`\`\`html
<div on="search" debounce="300"></div>
\`\`\`
→ This element will respond to the \`search\` action at most once every 300ms,
  even if the action fires multiple times.`,
        },
      },
      {
        name: "throttle",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`throttle\`

* Specifies a **minimum interval in milliseconds** between consecutive responses
  of this element to an event action.
* While throttled, repeated triggers of the same action on this element are
  ignored until the interval has passed.
* Useful for preventing rapid repeated requests.

💡 Example:
\`\`\`html
<div on="search" throttle="300"></div>
\`\`\`
→ This element will respond to the \`search\` action
  **at most once every 300ms**, even if the action fires multiple times.`,
        },
      },
      {
        name: "method",
        valueSet: "method",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`method\`

* Overrides the default HTTP method for a request triggered by this element's
  event action.
* Normally an HTML form attribute, KEML makes it available on **any element with
  an \`on\` attribute**.
* Method determination follows this order:
  1. Default is \`GET\`.
  2. Attributes \`post\`, \`put\`, or \`delete\` are checked **in order**, and
     the **first one found** overrides the default.
  3. The \`method\` attribute, if present, **finally overrides** any previous
     determination.

💡 Example:
\`\`\`html
<input on="doStuff" post="/foo" method="PUT">
\`\`\`
→ Sends a PUT request to "/foo", overriding the default POST method.`,
        },
      },
      {
        name: "name",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`name\`

* Assigns a **name** to this element for use in requests originating from this
  element itself.
* Normally a form field attribute, KEML makes it available on **any element with
  an \`on\` attribute**.
* For non-form elements, the value is **only included** if the element itself
  sends the request.
  Form fields behave as usual and are included when their form is serialized.

💡 Example:
\`\`\`html
<div name="lastName" value="Doe" on="save"></div>
\`\`\`
→ If this div itself sends a request, the payload will include
  \`lastName=Doe\`.`,
        },
      },
      {
        name: "credentials",
        valueSet: "v",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`credentials\`

* When present, sets \`XMLHttpRequest.withCredentials\` to \`true\` for requests
  triggered by this element.
* Makes cross-origin requests include credentials such as cookies, authorization
  headers, or TLS client certificates.
* Can be set with or without a value; presence alone is enough.

💡 Example:
\`\`\`html
<div on="save" post="/data" credentials></div>
\`\`\`
→ The request to "/data" will include credentials like cookies.`,
        },
      },
      {
        name: "result",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`result\`

* Fires **one or more result actions** based on the network response status:
  * fired if \`status < 400\` (success)
* Multiple actions can be listed **space-separated**; all reference the same
  network response.
* Other elements can **subscribe** to these actions using the \`render\`
  attribute.

💡 Example:
\`\`\`html
<input on="save" post="/todos" result="todoList highlight">
<div render="todoList"></div>
\`\`\`
→ Triggers both \`todoList\` and \`highlight\` actions. Other elements with
  \`render="todoList"\` or \`render="highlight"\` will respond accordingly.`,
        },
      },
      {
        name: "error",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`error\`

* Fires **one or more result actions** based on the network response status:
  * fired if \`status >= 400\` (failure)
* Multiple actions can be listed **space-separated**; all reference the same
  network response.
* Other elements can **subscribe** to these actions using the \`render\`
  attribute.

💡 Example:
\`\`\`html
<input on="save" post="/todos" error="todoList highlight">
<div render="todoList"></div>
\`\`\`
→ Triggers both \`todoList\` and \`highlight\` actions. Other elements with
  \`render="todoList"\` or \`render="highlight"\` will respond accordingly.`,
        },
      },
      {
        name: "redirect",
        valueSet: "redirect",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`redirect\`

* Configures how an element with an \`on\` attribute navigates instead of
  sending a network request.
* Accepts one of four values:
  * \`pushState\` → uses the History API to push a new state
    (in-app navigation, can go back)
  * \`replaceState\` → uses the History API to replace the current state
    (in-app navigation, cannot go back)
  * \`assign\` → navigates normally, fully reloading the page
  * \`replace\` → navigates normally, fully reloading the page and replacing the
    current history entry
* URIs are resolved the same way as request endpoints.

💡 Example:
\`\`\`html
<div on="save" get="/dashboard" redirect="pushState"></div>
\`\`\`
→ When triggered, navigates using pushState instead of sending a request.`,
        },
      },
      {
        name: "once",
        valueSet: "v",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`once\`

* Can be added to any element with an \`on\` attribute.
* Automatically removes the \`on\` attribute
  **before starting the request or redirect**.
* Ensures the associated action only runs **once**, even if triggered multiple
  times.

💡 Example:
\`\`\`html
<input on="save" once>
\`\`\`
→ The \`save\` action runs only once; subsequent clicks do nothing.`,
        },
      },
      {
        name: "value",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`value\`

* Assigns a **value** to this element for use in requests originating from this
  element itself.
* Normally a form field attribute, KEML makes it available on **any element with
  an \`on\` attribute**.
* For non-form elements, the value is **only included** if the element itself
  sends the request.
  Form fields behave as usual and are included when their form is serialized.

💡 Example:
\`\`\`html
<div name="lastName" value="Doe" on="save"></div>
\`\`\`
→ If this div itself sends a request, the payload will include
  \`lastName=Doe\`.`,
        },
      },
    ]),
  tags: valueTags
    .map(name => ({
      name,
      attributes: [
        {
          name: "if:value",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Attribute**: \`if:value\`

* Can only be used on **inputs, selects, text areas, and checkboxes**.
* Subscribes the element to a **state action** that turns ON when the element
  has a **non-empty value** and OFF when it is empty.
* Any attribute prefixed with \`x-\` will be applied when the state is ON and
  reverted when the state is OFF.

💡 Example:
\`\`\`html
<input if:value="isNotEmpty" type="text">
<div if="isNotEmpty" x-style="display: none">empty</div>
<div if="isNotEmpty" style="display: none" x-style>not empty</div>
\`\`\`
→ The first div is visible when the input is empty, and the second div is
  visible when it has a value.`,
          },
        },
      ],
    }))
    .concat(
      validityTags.map(name => ({
        name,
        attributes: [
          {
            name: "if:invalid",
            description: {
              kind: MarkupKind.Markdown,
              value: `**Attribute**: \`if:invalid\`

* Can only be used on **forms or form fields**.
* Subscribes the element to a **state action** that turns ON when the element
  becomes **invalid** and OFF when it becomes **valid**.
* Invalid elements do **not** trigger server requests.
* Any attribute on the element prefixed with \`x-\` will be applied when the
  state is ON and reverted when the state is OFF.

💡 Example:
\`\`\`html
<input if:invalid="invalidEmail" type="email">
<div if="invalidEmail" x-style="display: none">valid</div>
<div if="invalidEmail" style="display: none" x-style>invalid</div>
\`\`\`
→ The first div will be visible when the input is valid, and the second div will
  be visible when it is invalid.`,
            },
          },
        ],
      }))
    ),
  valueSets: [
    {
      name: "position",
      values: [
        {
          name: "replaceChildren",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replaceChildren\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Replaces **all children** of the element with the server response. This is the
  default behavior.

💡 Example:
\`\`\`html
<div render="userCount" position="replaceChildren"></div>
\`\`\`
→ The content of the div is replaced with the response whenever "userCount"
  updates.`,
          },
        },
        {
          name: "replaceWith",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replaceWith\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Replaces the **entire element** with the server response.

💡 Example:
\`\`\`html
<span render="userCount" position="replaceWith"></span>
\`\`\`
→ The span element itself is replaced by the server response.`,
          },
        },
        {
          name: "before",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`before\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Inserts the server response directly **before** the element.

💡 Example:
\`\`\`html
<div render="userCount" position="before"></div>
\`\`\`
→ The response is inserted immediately before the div.`,
          },
        },
        {
          name: "after",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`after\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Inserts the server response directly **after** the element.

💡 Example:
\`\`\`html
<div render="userCount" position="after"></div>
\`\`\`
→ The response is inserted immediately after the div.`,
          },
        },
        {
          name: "prepend",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`prepend\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Prepends the server response as the **first child** of the element.

💡 Example:
\`\`\`html
<div render="userCount" position="prepend"></div>
\`\`\`
→ The response is added at the beginning of the div's children.`,
          },
        },
        {
          name: "append",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`append\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Appends the server response as the **last child** of the element.

💡 Example:
\`\`\`html
<div render="userCount" position="append"></div>
\`\`\`
→ The response is added at the end of the div's children.`,
          },
        },
      ],
    },
    {
      name: "redirect",
      values: [
        {
          name: "pushState",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`pushState\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Uses the **History API** to push a new state without reloading the page.

💡 Example:
\`\`\`html
<div on="navigate" src="/dashboard" redirect="pushState"></div>
\`\`\`
→ Navigates in-app without reloading the page.`,
          },
        },
        {
          name: "replaceState",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replaceState\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Uses the **History API** to replace the current state without reloading the
  page.

💡 Example:
\`\`\`html
<div on="navigate" href="/dashboard" redirect="replaceState"></div>
\`\`\`
→ Replaces the current history entry in-app without reloading.`,
          },
        },
        {
          name: "assign",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`assign\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Performs a **full page navigation** to the target URL using
  \`location.assign()\`.

💡 Example:
\`\`\`html
<div on="navigate" get="/dashboard" redirect="assign"></div>
\`\`\`
→ Loads the dashboard page fully, replacing the current page.`,
          },
        },
        {
          name: "replace",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replace\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Performs a **full page navigation** to the target URL using
  \`location.replace()\`, replacing the current history entry.

💡 Example:
\`\`\`html
<div on="navigate" action="/dashboard" redirect="replace"></div>
\`\`\`
→ Loads the dashboard page fully, replacing the current page and history
  entry.`,
          },
        },
      ],
    },
    { name: "method", values: Object.keys(methods).map(getMethodValue) },
  ],
};

const defaultProvider = getDefaultHTMLDataProvider();
const staticProvider = newHTMLDataProvider("keml", customData);

const expandEventAttr = (attrData: IAttributeData) => {
  const { name } = attrData;

  return name.length > 2 &&
    name.charCodeAt(0) === 111 &&
    name.charCodeAt(1) === 110 &&
    name.charCodeAt(2) !== 58
    ? getEventAttrs(name.slice(2)).concat(attrData)
    : attrData;
};

const isAllowedAttr = (attrData: IAttributeData) => {
  const { name } = attrData;

  return isEventFilter(name)
    ? `on${name.slice(name.indexOf(":"))}` in currentAttributes ||
        `x-on${name.slice(name.indexOf(":"))}` in currentAttributes
    : isPosition(name)
    ? "render" in currentAttributes || "x-render" in currentAttributes
    : isOnDependent(name)
    ? "on" in currentAttributes || "x-on" in currentAttributes
    : true;
};

const provideActionValues = (
  resolver: (cur: ParsedDocument) => Map<string, Range[]>,
  converter: (name: string) => IValueData
) => {
  const seen = new Set<string>();
  const result = [];
  let action;

  for (const cur of docs.values()) {
    for (action of resolver(cur).keys()) {
      if (!seen.has(action)) {
        result.push(converter(action));
        seen.add(action);
      }
    }
  }

  return result;
};

const providedTags = mergeDefinitions(
  staticProvider.provideTags(),
  defaultProvider.provideTags()
);
const providedValues = new Map<string, Map<string, IValueData[]>>();
const providedAttributes = new Map<string, IAttributeData[]>();

const customProvider: IHTMLDataProvider = {
  getId: staticProvider.getId.bind(staticProvider),

  isApplicable: languageId => languageIds.includes(languageId),

  provideTags: () => providedTags,

  provideValues: (tag, attribute) => {
    if (isEventReference(attribute)) {
      return provideActionValues(getEventDefinitions, getEventValue);
    }

    if (isStateReference(attribute)) {
      return provideActionValues(getStateDefinitions, getStateValue);
    }

    if (isResultReference(attribute)) {
      return provideActionValues(getResultDefinitions, getResultValue);
    }

    let tagged = providedValues.get(tag);

    if (!tagged) {
      providedValues.set(tag, (tagged = new Map()));
    }

    let attributed = tagged.get(attribute);

    if (!attributed) {
      tagged.set(
        attribute,
        (attributed = mergeDefinitions(
          staticProvider.provideValues(tag, attribute),
          defaultProvider.provideValues(tag, attribute)
        ))
      );
    }

    return attributed;
  },

  provideAttributes: tag => {
    let tagged = providedAttributes.get(tag);

    if (!tagged) {
      providedAttributes.set(
        tag,
        (tagged = mergeDefinitions(
          staticProvider.provideAttributes(tag),
          defaultProvider.provideAttributes(tag)
        ).flatMap(expandEventAttr))
      );
    }

    return tagged.filter(isAllowedAttr);
  },
};

const service = getLanguageService({
  useDefaultDataProvider: false,
  customDataProviders: [customProvider],
});

// #endregion

// #region Main

const addCompletions = (
  completions: CompletionItem[],
  definitionsGetter: (cur: ParsedDocument) => Map<string, Range[]>,
  referencesGetter: (cur: ParsedDocument) => Map<string, Range[]>,
  range: Range,
  valueGetter: (name: string) => ReturnType<typeof getStateValue>
) => {
  const done = new Set<string>();
  let action, item, documentation;

  for (const cur of docs.values()) {
    for (action of combineIterators(
      definitionsGetter(cur).keys(),
      referencesGetter(cur).keys()
    )) {
      if (done.has(action)) {
        continue;
      }
      documentation = getExistingActionValue(
        action,
        definitionsGetter,
        valueGetter
      );
      if (!documentation) {
        continue;
      }
      item = new CompletionItem(action, CompletionItemKind.Value);
      item.preselect = true;
      item.insertText = action;
      item.range = range;
      item.documentation = new MarkdownString(documentation.description.value);
      completions.push(item);
      done.add(action);
    }
  }
};

const getLocations = (
  value: string,
  resolver: (cur: ParsedDocument) => Map<string, Range[]>
) => {
  const result = [];
  let ranges, range;

  for (const cur of docs.values()) {
    if ((ranges = resolver(cur).get(value))) {
      for (range of ranges) {
        result.push(new Location(cur.doc.uri, range));
      }
    }
  }

  return result;
};

const completionProvider: CompletionItemProvider = {
  provideCompletionItems(doc, position, { isCancellationRequested }) {
    if (isCancellationRequested) {
      return;
    }

    const cur = docs.get(doc.uri.toString());
    if (!cur) {
      return;
    }

    const { textDoc, htmlDoc } = cur;
    const offset = textDoc.offsetAt(position);
    const node = htmlDoc.findNodeAt(offset);
    const attr = getAttrAtOffset(textDoc, node, offset);
    currentAttributes = node.attributes ?? {};

    const completions = service
      .doComplete(textDoc, position, htmlDoc)
      .items.map(convertCompletionItem);

    if (attr) {
      const { name } = attr;
      const range =
        doc.getWordRangeAtPosition(position, /[^"\s]+/) ??
        new Range(position, position);

      if (isEventDefinition(name)) {
        addCompletions(
          completions,
          getEventDefinitions,
          getEventReferences,
          range,
          getEventValue
        );
      } else if (isStateDefinition(name)) {
        addCompletions(
          completions,
          getStateDefinitions,
          getStateReferences,
          range,
          getStateValue
        );
      } else if (isResultDefinition(name)) {
        addCompletions(
          completions,
          getResultDefinitions,
          getResultReferences,
          range,
          getResultValue
        );
      }
    }

    return completions;
  },
};

const provideReferences = (
  eventResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  stateResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  resultResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  doc: TextDocument,
  position: Position,
  { isCancellationRequested }: CancellationToken
) => {
  if (isCancellationRequested) {
    return;
  }

  const cur = docs.get(doc.uri.toString());
  if (!cur) {
    return;
  }

  const { textDoc, htmlDoc } = cur;
  const offset = textDoc.offsetAt(position);
  const node = htmlDoc.findNodeAt(offset);
  const attr = getAttrAtOffset(textDoc, node, offset);
  if (!attr) {
    return;
  }

  let { name, value } = attr;

  if (isEventReference(name)) {
    return getLocations(value, eventResolver);
  }

  if (isStateReference(name)) {
    return getLocations(value, stateResolver);
  }

  if (isResultReference(name)) {
    return getLocations(value, resultResolver);
  }

  const range = doc.getWordRangeAtPosition(position, /[^"\s]+/);
  if (!range) {
    return;
  }

  value = doc.getText(range);

  if (isEventDefinition(name)) {
    return getLocations(value, eventResolver);
  }

  if (isStateDefinition(name)) {
    return getLocations(value, stateResolver);
  }

  if (isResultDefinition(name)) {
    return getLocations(value, resultResolver);
  }

  return;
};

const definitionProvider: DefinitionProvider = {
  provideDefinition: (doc, position, token) =>
    provideReferences(
      getEventDefinitions,
      getStateDefinitions,
      getResultDefinitions,
      doc,
      position,
      token
    ),
};

const referenceProvider: ReferenceProvider = {
  provideReferences: (doc, position, _context, token) =>
    provideReferences(
      getEventReferences,
      getStateReferences,
      getResultReferences,
      doc,
      position,
      token
    ),
};

const hoverProvider: HoverProvider = {
  provideHover(doc, position, { isCancellationRequested }) {
    if (isCancellationRequested) {
      return;
    }

    const cur = docs.get(doc.uri.toString());
    if (!cur) {
      return;
    }

    const { textDoc, htmlDoc } = cur;
    const offset = textDoc.offsetAt(position);
    const node = htmlDoc.findNodeAt(offset);
    currentAttributes = node.attributes ?? {};

    const hover = service.doHover(textDoc, position, htmlDoc);
    if (hover) {
      return convertHover(hover);
    }

    const range = doc.getWordRangeAtPosition(position, /[^"\s]+/);
    if (!range) {
      return;
    }

    const attr = getAttrAtOffset(textDoc, node, offset);
    if (!attr) {
      return;
    }

    const { name } = attr;
    let definitionsGetter, valueGetter;

    if (isEventDefinition(name)) {
      definitionsGetter = getEventDefinitions;
      valueGetter = getEventValue;
    } else if (isStateDefinition(name)) {
      definitionsGetter = getStateDefinitions;
      valueGetter = getStateValue;
    } else if (isResultDefinition(name)) {
      definitionsGetter = getResultDefinitions;
      valueGetter = getResultValue;
    } else {
      return;
    }

    const documentation = getExistingActionValue(
      doc.getText(range),
      definitionsGetter,
      valueGetter
    );
    if (!documentation) {
      return;
    }

    return new Hover(
      new MarkdownString(documentation.description.value),
      range
    );
  },
};

export const activate = async ({ subscriptions }: ExtensionContext) => {
  diagnosticCollection = languages.createDiagnosticCollection("KEML");

  await init();

  subscriptions.push(
    diagnosticCollection,
    workspace.onDidChangeConfiguration(onDidChangeConfiguration),
    workspace.onDidChangeTextDocument(onDidChangeTextDocument),
    workspace.onDidChangeWorkspaceFolders(createFileSystemWatcher),
    workspace.onDidCreateFiles(onDidCreateFiles),
    workspace.onDidDeleteFiles(onDidDeleteFiles),
    workspace.onDidOpenTextDocument(onDidCreateDoc),
    workspace.onDidRenameFiles(onDidRenameFiles)
  );
};

export const deactivate = () => {
  watcher.dispose();

  let disposable;
  for (const disposables of languageDisposables.values()) {
    for (disposable of disposables) {
      disposable.dispose();
    }
  }
  languageDisposables.clear();
};

// #endregion
