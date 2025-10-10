import { Diagnostic } from "vscode";
import { addReferenceDiagnostics } from "./addReferenceDiagnostics.mts";
import { docs, getDiagnosticCollection } from "./data.mts";
import { getEventDefinitions } from "./getEventDefinitions.mts";
import { getEventReferences } from "./getEventReferences.mts";
import { getResultDefinitions } from "./getResultDefinitions.mts";
import { getResultReferences } from "./getResultReferences.mts";
import { getStateDefinitions } from "./getStateDefinitions.mts";
import { getStateReferences } from "./getStateReferences.mts";

/**
 * Updates the diagnostic collection for all documents.
 *
 * Clears the existing diagnostics and adds reference diagnostics for events,
 * states, and results.
 */
export const updateDiagnosticCollection = () => {
  const diagnosticCollection = extern.getDiagnosticCollection();

  diagnosticCollection.clear();

  let diagnostics: Diagnostic[];

  for (const cur of extern.docs.values()) {
    diagnostics = [];
    extern.addReferenceDiagnostics(
      diagnostics,
      cur,
      getEventDefinitions,
      getEventReferences,
      "event"
    );
    extern.addReferenceDiagnostics(
      diagnostics,
      cur,
      getStateDefinitions,
      getStateReferences,
      "state"
    );
    extern.addReferenceDiagnostics(
      diagnostics,
      cur,
      getResultDefinitions,
      getResultReferences,
      "result"
    );
    diagnosticCollection.set(cur.uri, diagnostics.concat(cur.diagnostics));
  }
};

let extern = { addReferenceDiagnostics, docs, getDiagnosticCollection };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    afterAll,
    expect,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("updateDiagnosticCollection", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("clears and sets diagnostics for each document", () => {
      const diagCollection = {
        clear: fn(),
        set: fn(),
      };

      const doc1 = { uri: "uri1", diagnostics: ["old1"] } as any;
      const doc2 = { uri: "uri2", diagnostics: ["old2"] } as any;

      extern.getDiagnosticCollection = fn(() => diagCollection) as any;
      extern.docs = new Map([
        ["doc1", doc1],
        ["doc2", doc2],
      ]);
      extern.addReferenceDiagnostics = fn(diags => diags.push("new"));

      updateDiagnosticCollection();

      // clear called once
      expect(diagCollection.clear).toHaveBeenCalled();

      // addReferenceDiagnostics called 3 times per doc
      expect(extern.addReferenceDiagnostics).toHaveBeenCalledTimes(6);

      // set called once per doc with combined diagnostics
      expect(diagCollection.set).toHaveBeenCalledWith("uri1", [
        "new",
        "new",
        "new",
        "old1",
      ]);
      expect(diagCollection.set).toHaveBeenCalledWith("uri2", [
        "new",
        "new",
        "new",
        "old2",
      ]);
    });
  });
}
/* v8 ignore stop */
