import {
  CancellationToken,
  DefinitionProvider,
  Position,
  Range,
  ReferenceProvider,
  TextDocument,
} from "vscode";
import { docs } from "./configure";
import { getAttrAtOffset } from "./getAttrAtOffset";
import { getEventDefinitions } from "./getEventDefinitions";
import { getEventReferences } from "./getEventReferences";
import { getLocations } from "./getLocations";
import { getResultDefinitions } from "./getResultDefinitions";
import { getResultReferences } from "./getResultReferences";
import { getStateDefinitions } from "./getStateDefinitions";
import { getStateReferences } from "./getStateReferences";
import { isEventDefinition } from "./isEventDefinition";
import { isEventReference } from "./isEventReference";
import { isResultDefinition } from "./isResultDefinition";
import { isResultReference } from "./isResultReference";
import { isStateDefinition } from "./isStateDefinition";
import { isStateReference } from "./isStateReference";

/**
 * Retrieves all locations associated with a symbol (definition or reference)
 * based on its type (event, state, result) and attribute position.
 *
 * @param eventResolver - Function that resolves event definitions or
 *                        references.
 * @param stateResolver - Function that resolves state definitions or
 *                        references.
 * @param resultResolver - Function that resolves result definitions or
 *                         references.
 * @param doc - The current text document.
 * @param position - The cursor position within the document.
 * @param token - Cancellation token provided by VS Code.
 *
 * @returns An array of `Location` objects representing definition or reference
 *          locations, or `undefined` if none found or the operation was
 *          cancelled.
 */
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

/**
 * VS Code definition provider that returns the locations of a symbol's
 * definition.
 *
 * Uses the `provideReferences` helper to determine the symbol at the cursor
 * and look up its definition locations for events, states, and results.
 *
 * @example
 * ```ts
 * import { languages } from "vscode";
 * import { definitionProvider } from "./definitionProvider";
 *
 * languages.registerDefinitionProvider("html", definitionProvider);
 * ```
 */
export const definitionProvider: DefinitionProvider = {
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

/**
 * VS Code reference provider that returns all locations where a symbol is
 * referenced.
 *
 * Uses the `provideReferences` helper to determine the symbol at the cursor
 * and look up all reference locations for events, states, and results.
 *
 * @example
 * ```ts
 * import { languages } from "vscode";
 * import { referenceProvider } from "./definitionProvider";
 *
 * languages.registerReferenceProvider("html", referenceProvider);
 * ```
 */
export const referenceProvider: ReferenceProvider = {
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
