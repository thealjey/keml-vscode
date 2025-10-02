import { Diagnostic } from "vscode";
import { addReferenceDiagnostics } from "./addReferenceDiagnostics";
import { docs, getDiagnosticCollection } from "./configure";
import { getEventDefinitions } from "./getEventDefinitions";
import { getEventReferences } from "./getEventReferences";
import { getResultDefinitions } from "./getResultDefinitions";
import { getResultReferences } from "./getResultReferences";
import { getStateDefinitions } from "./getStateDefinitions";
import { getStateReferences } from "./getStateReferences";

/**
 * Updates the VS Code diagnostic collection for all documents.
 *
 * This function iterates through all parsed documents and generates diagnostics
 * for event, state, and result actions. It combines newly computed diagnostics
 * with any existing diagnostics stored on the document, then updates the global
 * diagnostic collection.
 *
 * @remarks
 * The diagnostic generation leverages `addReferenceDiagnostics` to detect:
 * - Unused actions
 * - Undefined actions
 * - Reference mismatches between definitions and usages
 *
 * After computing diagnostics for each document, the global diagnostic
 * collection is cleared and repopulated with the new set of diagnostics.
 *
 * @example
 * ```ts
 * import { updateDiagnosticCollection } from "./updateDiagnosticCollection";
 *
 * updateDiagnosticCollection();
 * ```
 */
export const updateDiagnosticCollection = () => {
  const diagnosticCollection = getDiagnosticCollection();

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
