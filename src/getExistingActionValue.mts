import { Range } from "vscode";
import { IValueData } from "vscode-html-languageservice";
import { docs } from "./data.mts";

/**
 * Retrieves the value data for an existing action by name, if it exists.
 *
 * @param name - The name of the action.
 * @param definitionsGetter - Function to retrieve definitions from a document.
 * @param valueGetter - Function to retrieve value data for a given action name.
 * @returns The value data for the action, or undefined if not found.
 */
export const getExistingActionValue = (
  name: string,
  definitionsGetter: (cur: Document) => Map<string, Range[]>,
  valueGetter: (name: string) => IValueData
) => {
  for (const cur of extern.docs.values()) {
    if (definitionsGetter(cur).has(name)) {
      return valueGetter(name);
    }
  }
  return;
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

  describe("getExistingActionValue", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns value when a definition exists", () => {
      const dummyDoc = {} as Document;
      const name = "myAction";

      // mock extern.docs.values()
      extern.docs = new Map([
        ["doc1", dummyDoc],
      ]) as unknown as typeof extern.docs;

      // mock functions
      const definitionsGetter = fn(() => new Map([[name, [{} as any]]]));
      const expectedValue = { value: 42 } as any;
      const valueGetter = fn(() => expectedValue);

      const result = getExistingActionValue(
        name,
        definitionsGetter,
        valueGetter
      );

      expect(result).toBe(expectedValue);
      expect(definitionsGetter).toHaveBeenCalledWith(dummyDoc);
      expect(valueGetter).toHaveBeenCalledWith(name);
    });

    it("returns undefined when no definition exists", () => {
      const dummyDoc = {} as Document;
      const name = "myAction";

      // mock extern.docs.values()
      extern.docs = new Map([
        ["doc1", dummyDoc],
      ]) as unknown as typeof extern.docs;

      const definitionsGetter = fn(() => new Map()); // empty map → no match
      const valueGetter = fn();

      const result = getExistingActionValue(
        name,
        definitionsGetter,
        valueGetter
      );

      expect(result).toBeUndefined();
      expect(definitionsGetter).toHaveBeenCalledWith(dummyDoc);
      expect(valueGetter).not.toHaveBeenCalled();
    });
  });
}
/* v8 ignore stop */
