import { HoverProvider } from "vscode";
import { docs } from "./data.mts";

/**
 * Provides hover information for documents.
 */
export const hoverProvider: HoverProvider = {
  /**
   * Provides hover information at a given position in a document.
   *
   * @param doc - The document in which to provide hover information.
   * @param position - The position within the document.
   * @param context - The context, including cancellation information.
   * @returns A hover object if available, otherwise undefined.
   */
  provideHover(doc, position, { isCancellationRequested }) {
    if (isCancellationRequested) {
      return;
    }

    return extern.docs.get(doc.uri.toString())?.doHover(position);
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

  describe("hoverProvider", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns undefined if cancellation is requested", () => {
      const doc = { uri: { toString: () => "docUri" } } as any;
      const position = { line: 0, character: 0 } as any;

      const result = hoverProvider.provideHover(doc, position, {
        isCancellationRequested: true,
      } as any);

      expect(result).toBeUndefined();
    });

    it("calls doHover and returns its result when not cancelled", () => {
      const doc = { uri: { toString: () => "docUri" } } as any;
      const position = { line: 1, character: 2 } as any;
      const doHoverResult = { contents: "hover info" };
      const doHoverMock = fn(() => doHoverResult);

      extern.docs = new Map([["docUri", { doHover: doHoverMock }]]) as any;

      const result = hoverProvider.provideHover(doc, position, {
        isCancellationRequested: false,
      } as any);

      expect(result).toBe(doHoverResult);
      expect(doHoverMock).toHaveBeenCalledWith(position);
    });
  });
}
/* v8 ignore stop */
