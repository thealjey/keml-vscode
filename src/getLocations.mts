import { Location, Range } from "vscode";
import { docs } from "./data.mts";

/**
 * Retrieves locations for a given value using a resolver function.
 *
 * @param value - The value to find locations for.
 * @param resolver - Function to retrieve ranges from a document.
 * @returns An array of locations corresponding to the value.
 */
export const getLocations = (
  value: string,
  resolver: (cur: Document) => Map<string, Range[]>
) => {
  const result = [];
  let ranges, range;

  for (const cur of extern.docs.values()) {
    if ((ranges = resolver(cur).get(value))) {
      for (range of ranges) {
        result.push(new extern.Location(cur.uri, range));
      }
    }
  }

  return result;
};

let extern = { Location, docs };

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

  describe("getLocations", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns mapped Location objects for matching values", () => {
      // Mock docs as a Map of Document objects
      const doc1 = { uri: "uri1" };
      const doc2 = { uri: "uri2" };
      const resolver = fn((cur: any) => {
        const map = new Map<string, any[]>();
        if (cur.uri === "uri1") map.set("value1", [{ start: 0, end: 5 }]);
        if (cur.uri === "uri2") map.set("value1", [{ start: 10, end: 15 }]);
        return map;
      });

      extern.docs = new Map([
        ["doc1", doc1],
        ["doc2", doc2],
      ]) as any;
      extern.Location = class {
        constructor(public uri: any, public range: any) {}
      };

      const result = getLocations("value1", resolver);

      expect(result).toEqual([
        { uri: "uri1", range: { start: 0, end: 5 } },
        { uri: "uri2", range: { start: 10, end: 15 } },
      ]);
    });

    it("returns an empty array when no matches are found", () => {
      const doc = { uri: "uri" };
      const resolver = fn(() => new Map());
      extern.docs = new Map([["doc", doc]]) as any;
      extern.Location = class {
        constructor(public uri: any, public range: any) {}
      };

      const result = getLocations("missing", resolver);

      expect(result).toEqual([]);
    });
  });
}
/* v8 ignore stop */
