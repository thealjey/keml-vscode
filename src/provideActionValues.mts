import { Range } from "vscode";
import { IValueData } from "vscode-html-languageservice";
import { docs } from "./data.mts";

/**
 * Collects unique action values from documents using a resolver and converter.
 *
 * @param resolver Function that maps a document to its action ranges.
 * @param converter Function that converts an action name into a value object.
 * @returns Array of converted action values with duplicates removed.
 */
export const provideActionValues = (
  resolver: (cur: Document) => Map<string, Range[]>,
  converter: (name: string) => IValueData
) => {
  const seen = new Set<string>();
  const result = [];
  let action;

  for (const cur of extern.docs.values()) {
    for (action of resolver(cur).keys()) {
      if (!seen.has(action)) {
        result.push(converter(action));
        seen.add(action);
      }
    }
  }

  return result;
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

  describe("provideActionValues", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns converted unique action values from all documents", () => {
      // mock docs map
      const docA = { uri: "A" };
      const docB = { uri: "B" };
      extern.docs = new Map([
        ["A", docA],
        ["B", docB],
      ]) as any;

      // mock resolver returning overlapping actions
      const resolver = fn((cur: any) => {
        if (cur === docA)
          return new Map([
            ["foo", []],
            ["bar", []],
          ]);
        if (cur === docB)
          return new Map([
            ["bar", []],
            ["baz", []],
          ]);
        return new Map();
      });

      // mock converter to produce identifiable output
      const converter = fn((name: string) => ({ converted: name })) as any;

      const result = provideActionValues(resolver, converter);

      expect(result).toEqual([
        { converted: "foo" },
        { converted: "bar" },
        { converted: "baz" },
      ]);
      expect(converter).toHaveBeenCalledTimes(3);
      expect(converter).toHaveBeenCalledWith("foo");
      expect(converter).toHaveBeenCalledWith("bar");
      expect(converter).toHaveBeenCalledWith("baz");
    });

    it("returns an empty array when no actions exist", () => {
      extern.docs = new Map([["X", {}]]) as any;
      const resolver = fn(() => new Map());
      const converter = fn();

      const result = provideActionValues(resolver, converter);

      expect(result).toEqual([]);
      expect(converter).not.toHaveBeenCalled();
    });
  });
}
/* v8 ignore stop */
