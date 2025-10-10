import { CompletionItem, CompletionItemKind, Range } from "vscode";
import { IValueData } from "vscode-html-languageservice";
import { combineIterators } from "./combineIterators.mts";
import { convertDocumentation } from "./convertDocumentation.mts";
import { docs } from "./data.mts";
import { getExistingActionValue } from "./getExistingActionValue.mts";

/**
 * Adds completion items to the provided list based on available definitions and
 * references.
 *
 * @param completions - Array to which new completion items will be added.
 * @param definitionsGetter - Function that returns a map of definitions for the
 *                            current document.
 * @param referencesGetter - Function that returns a map of references for the
 *                           current document.
 * @param range - Range in the document where the completion will be applied.
 * @param valueGetter - Function that retrieves value data for a given action
 *                      name.
 */
export const addCompletions = (
  completions: CompletionItem[],
  definitionsGetter: (cur: Document) => Map<string, Range[]>,
  referencesGetter: (cur: Document) => Map<string, Range[]>,
  range: Range,
  valueGetter: (name: string) => IValueData
) => {
  const done = new Set<string>();
  let action, item, valueData;

  for (const cur of extern.docs.values()) {
    for (action of extern.combineIterators(
      definitionsGetter(cur).keys(),
      referencesGetter(cur).keys()
    )) {
      if (done.has(action)) {
        continue;
      }
      valueData = extern.getExistingActionValue(
        action,
        definitionsGetter,
        valueGetter
      );
      if (!valueData || !valueData.description) {
        continue;
      }
      item = new extern.CompletionItem(action, CompletionItemKind.Value);
      item.preselect = true;
      item.insertText = action;
      item.range = range;
      item.documentation = extern.convertDocumentation(valueData.description);
      completions.push(item);
      done.add(action);
    }
  }
};

let extern = {
  CompletionItem,
  combineIterators,
  convertDocumentation,
  docs,
  getExistingActionValue,
};

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

  describe("addCompletions", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("adds completion items for valid actions with description", () => {
      const completions: any[] = [];
      const fakeRange = { start: 0, end: 1 } as any;

      const mockDocs = new Map([["doc1", {}]]);
      extern.docs = { values: () => mockDocs.values() } as any;

      extern.combineIterators = fn().mockImplementation(() => ["act1", "act2"]);
      extern.getExistingActionValue = fn().mockImplementation(action => ({
        description: `desc-${action}`,
      }));
      extern.convertDocumentation = fn().mockImplementation(d => `doc-${d}`);
      extern.CompletionItem = fn().mockImplementation((label, kind) => ({
        label,
        kind,
      }));

      const defs = new Map();
      const refs = new Map();

      addCompletions(
        completions,
        () => defs,
        () => refs,
        fakeRange,
        fn()
      );
      expect(completions).toHaveLength(2);
      expect(completions[0]).toMatchObject({
        label: "act1",
        insertText: "act1",
        preselect: true,
        documentation: "doc-desc-act1",
        range: fakeRange,
      });
    });

    it("skips already processed actions", () => {
      const completions: any[] = [];
      const fakeRange = {} as any;

      const mockDocs = new Map([["doc1", {}]]);
      extern.docs = { values: () => mockDocs.values() } as any;
      extern.combineIterators = fn().mockReturnValue(["dup", "dup"]);
      extern.getExistingActionValue = fn().mockReturnValue({
        description: "desc",
      });
      extern.convertDocumentation = fn().mockReturnValue("doc");
      extern.CompletionItem = fn().mockImplementation(label => ({ label }));

      addCompletions(
        completions,
        fn().mockReturnValue(new Map()),
        fn().mockReturnValue(new Map()),
        fakeRange,
        fn()
      );
      expect(completions).toHaveLength(1);
    });

    it("skips actions with no valueData or description", () => {
      const completions: any[] = [];
      const fakeRange = {} as any;

      const mockDocs = new Map([["doc1", {}]]);
      extern.docs = { values: () => mockDocs.values() } as any;
      extern.combineIterators = fn().mockReturnValue(["noDesc", "noValue"]);
      extern.getExistingActionValue = fn()
        .mockImplementationOnce(() => ({}))
        .mockImplementationOnce(() => null);

      extern.CompletionItem = fn();
      extern.convertDocumentation = fn();

      addCompletions(
        completions,
        fn().mockReturnValue(new Map()),
        fn().mockReturnValue(new Map()),
        fakeRange,
        fn()
      );
      expect(completions).toHaveLength(0);
    });
  });
}
/* v8 ignore stop */
