import {
  CancellationToken,
  Location,
  SymbolInformation,
  SymbolKind,
  WorkspaceSymbolProvider,
} from "vscode";
import { documents } from "../document/data.mts";

/**
 * Supplies workspace symbols matching a query from indexed document data.
 *
 * Symbols are resolved from known identifiers in the workspace and may be
 * omitted if the operation is cancelled.
 */
export const workspaceSymbolProvider: WorkspaceSymbolProvider = {
  provideWorkspaceSymbols(
    query: string,
    { isCancellationRequested }: CancellationToken,
  ) {
    if (isCancellationRequested) {
      return;
    }
    const result: SymbolInformation[] = [];

    for (const {
      uri,
      identifiers: { registry },
    } of documents.values()) {
      for (const { definitions, references } of registry.values()) {
        let [range] = definitions.get(query) ?? references.get(query) ?? [];
        if (range) {
          result.push(
            new SymbolInformation(
              query,
              SymbolKind.Constant,
              "",
              new Location(uri, range),
            ),
          );
        }
      }
    }

    return result;
  },
};
