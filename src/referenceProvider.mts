import {
  CancellationToken,
  DefinitionProvider,
  Position,
  Range,
  ReferenceProvider,
  TextDocument,
} from "vscode";
import { docs } from "./data.mts";
import { getEventDefinitions } from "./getEventDefinitions.mts";
import { getEventReferences } from "./getEventReferences.mts";
import { getResultDefinitions } from "./getResultDefinitions.mts";
import { getResultReferences } from "./getResultReferences.mts";
import { getStateDefinitions } from "./getStateDefinitions.mts";
import { getStateReferences } from "./getStateReferences.mts";

/**
 * Provides references at a specific position in a document using multiple resolvers.
 *
 * @param eventResolver Function that maps a document to event action ranges.
 * @param stateResolver Function that maps a document to state action ranges.
 * @param resultResolver Function that maps a document to result action ranges.
 * @param doc The document to analyze.
 * @param position Position within the document to get references for.
 * @param param5 Cancellation token to abort the operation if requested.
 * @returns Reference data for the given position, or undefined if none found or
 *          cancelled.
 */
const provideReferences = (
  eventResolver: (cur: Document) => Map<string, Range[]>,
  stateResolver: (cur: Document) => Map<string, Range[]>,
  resultResolver: (cur: Document) => Map<string, Range[]>,
  doc: TextDocument,
  position: Position,
  { isCancellationRequested }: CancellationToken
) => {
  if (isCancellationRequested) {
    return;
  }

  return extern.docs
    .get(doc.uri.toString())
    ?.doRefer(eventResolver, stateResolver, resultResolver, position);
};

/**
 * Provides definitions for symbols at a given position in a document.
 */
export const definitionProvider: DefinitionProvider = {
  /**
   * Retrieves the definition locations for the symbol at the specified
   * position.
   *
   * @param doc Document to analyze.
   * @param position Position within the document.
   * @param token Cancellation token to abort the operation if requested.
   * @returns Definition locations or undefined if none are found.
   */
  provideDefinition: (doc, position, token) =>
    extern.provideReferences(
      getEventDefinitions,
      getStateDefinitions,
      getResultDefinitions,
      doc,
      position,
      token
    ),
};

/**
 * Provides references for symbols at a specific position in a document.
 */
export const referenceProvider: ReferenceProvider = {
  /**
   * Retrieves all reference locations for the symbol at the given position.
   *
   * @param doc Document to analyze.
   * @param position Position within the document.
   * @param _context Reference context (unused).
   * @param token Cancellation token to abort the operation if requested.
   * @returns Reference locations or undefined if none are found.
   */
  provideReferences: (doc, position, _context, token) =>
    extern.provideReferences(
      getEventReferences,
      getStateReferences,
      getResultReferences,
      doc,
      position,
      token
    ),
};

let extern = { docs, provideReferences };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    vi: { fn },
    afterAll,
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("definitionReferenceProviders", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("provideReferences returns undefined if cancelled", () => {
      const token = { isCancellationRequested: true } as any;
      const doc = { uri: { toString: fn() } } as any;

      // directly call the *real* function, not extern
      const result = provideReferences(fn(), fn(), fn(), doc, {} as any, token);

      expect(result).toBeUndefined();
    });

    it("provideReferences calls doRefer and returns its result", () => {
      const doRefer = fn(() => "ok");
      const doc = { uri: { toString: fn(() => "doc1") } } as any;
      const token = { isCancellationRequested: false } as any;
      extern.docs = new Map([["doc1", { doRefer }]]) as any;

      const eRes = fn(),
        sRes = fn(),
        rRes = fn();

      const result = provideReferences(
        eRes,
        sRes,
        rRes,
        doc,
        "pos" as any,
        token
      );

      expect(result).toBe("ok");
      expect(doRefer).toHaveBeenCalledWith(eRes, sRes, rRes, "pos");
    });

    it("definitionProvider uses getEvent/State/ResultDefinitions", () => {
      extern.provideReferences = fn();

      definitionProvider.provideDefinition(
        "doc" as any,
        "pos" as any,
        "token" as any
      );

      expect(extern.provideReferences).toHaveBeenCalledWith(
        getEventDefinitions,
        getStateDefinitions,
        getResultDefinitions,
        "doc",
        "pos",
        "token"
      );
    });

    it("referenceProvider uses getEvent/State/ResultReferences", () => {
      extern.provideReferences = fn();

      referenceProvider.provideReferences(
        "doc" as any,
        "pos" as any,
        "ctx" as any,
        "token" as any
      );

      expect(extern.provideReferences).toHaveBeenCalledWith(
        getEventReferences,
        getStateReferences,
        getResultReferences,
        "doc",
        "pos",
        "token"
      );
    });
  });
}
/* v8 ignore stop */
