import { diagnosticCollection, documents } from "./data.mts";

/**
 * Updates diagnostics for all workspace documents.
 *
 * Re-evaluates document state and refreshes reported issues.
 */
export const updateDiagnosticCollection = () => {
  diagnosticCollection.clear();

  for (const { identifiers } of documents.values()) {
    identifiers.resolve();
  }
};
