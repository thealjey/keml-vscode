import type { ReferenceProvider } from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies reference locations for symbols in the workspace.
 *
 * May return no results if the operation is cancelled or no references exist at
 * the given position.
 */
export const referenceProvider: ReferenceProvider = {
  provideReferences({ uri }, position, context, { isCancellationRequested }) {
    if (!isCancellationRequested) {
      return documents
        .get(uri.toString())
        ?.provideReferences(position, context);
    }
  },
};
