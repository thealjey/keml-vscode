import {
  CancellationToken,
  Position,
  RenameProvider,
  TextDocument,
} from "vscode";
import { documents } from "../document/data.mts";

/**
 * Enables symbol renaming within workspace documents.
 *
 * Supports validation/adjustment before renaming and produces text edits for
 * rename operations.
 * May return no result if the operation is cancelled or unsupported at the
 * given position.
 */
export const renameProvider: RenameProvider = {
  provideRenameEdits(
    { uri }: TextDocument,
    position: Position,
    newName: string,
    { isCancellationRequested }: CancellationToken,
  ) {
    if (!isCancellationRequested) {
      return documents
        .get(uri.toString())
        ?.provideRenameEdits(position, newName);
    }
  },

  prepareRename(
    { uri }: TextDocument,
    position: Position,
    { isCancellationRequested }: CancellationToken,
  ) {
    if (!isCancellationRequested) {
      return documents.get(uri.toString())?.prepareRename(position);
    }
  },
};
