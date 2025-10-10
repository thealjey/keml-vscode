import { CompletionItemProvider } from "vscode";
import { docs } from "./data.mts";

/**
 * Provides completion items for documents.
 */
export const completionProvider: CompletionItemProvider = {
  /**
   * Retrieves completion items at the specified position in a document.
   *
   * @param doc - Document in which to provide completions.
   * @param position - Position within the document for completion.
   * @param context - Context including cancellation status.
   * @returns An array of completion items or undefined if canceled or
   *          unavailable.
   */
  provideCompletionItems(doc, position, { isCancellationRequested }) {
    if (isCancellationRequested) {
      return;
    }

    return extern.docs.get(doc.uri.toString())?.doComplete(position);
  },
};

let extern = { docs };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("completionProvider", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns undefined if cancellation is requested", () => {
      extern.docs = new Map();
      const result = completionProvider.provideCompletionItems(
        {} as any,
        {} as any,
        { isCancellationRequested: true } as any,
        {} as any
      );
      expect(result).toBeUndefined();
    });

    it("calls doComplete and returns its result", () => {
      const doCompleteMock = fn().mockReturnValue([
        "completion1",
        "completion2",
      ]);
      const docMock = { uri: { toString: () => "doc1" } } as any;
      const positionMock = {} as any;

      extern.docs = new Map([["doc1", { doComplete: doCompleteMock } as any]]);

      const result = completionProvider.provideCompletionItems(
        docMock,
        positionMock,
        { isCancellationRequested: false } as any,
        {} as any
      );

      expect(doCompleteMock).toHaveBeenCalledWith(positionMock);
      expect(result).toEqual(["completion1", "completion2"]);
    });

    it("returns undefined if doc is not found in docs", () => {
      const docMock = { uri: { toString: () => "missingDoc" } } as any;
      const positionMock = {} as any;

      extern.docs = new Map();

      const result = completionProvider.provideCompletionItems(
        docMock,
        positionMock,
        { isCancellationRequested: false } as any,
        {} as any
      );

      expect(result).toBeUndefined();
    });
  });
}
/* v8 ignore stop */
