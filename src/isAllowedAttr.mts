import { IAttributeData } from "vscode-html-languageservice";
import { getAttributes } from "./data.mts";
import { isEventFilter } from "./isEventFilter.mts";
import { isOnDependent } from "./isOnDependent.mts";
import { isPosition } from "./isPosition.mts";

/**
 * Determines whether an attribute is allowed in the current context.
 *
 * @param attrData - The attribute data to check.
 * @returns True if the attribute is allowed, otherwise false.
 */
export const isAllowedAttr = (attrData: IAttributeData) => {
  const { name } = attrData;
  const attributes = extern.getAttributes();

  return extern.isEventFilter(name)
    ? attributes.has(`on${name.slice(name.indexOf(":"))}`) ||
        attributes.has(`x-on${name.slice(name.indexOf(":"))}`)
    : extern.isPosition(name)
    ? attributes.has("render") || attributes.has("x-render")
    : extern.isOnDependent(name)
    ? attributes.has("on") || attributes.has("x-on")
    : true;
};

let extern = { getAttributes, isEventFilter, isOnDependent, isPosition };

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

  describe("isAllowedAttr", () => {
    afterAll(() => {
      extern = origExtern;
    });

    // isEventFilter true, key exists
    it("isEventFilter true with matching key returns true", () => {
      const attrData = { name: "event:click" };
      extern.getAttributes = fn(() => new Set(["on:click"])) as any;
      extern.isEventFilter = fn(() => true);
      extern.isPosition = fn(() => false) as any;
      extern.isOnDependent = fn(() => false);

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isEventFilter true, key missing
    it("isEventFilter true with no matching key returns false", () => {
      const attrData = { name: "event:click" };
      extern.getAttributes = fn(() => new Set()) as any;
      extern.isEventFilter = fn(() => true);
      extern.isPosition = fn(() => false) as any;
      extern.isOnDependent = fn(() => false);

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isPosition true, key exists
    it("isPosition true with matching key returns true", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = fn(() => new Set(["render"])) as any;
      extern.isEventFilter = fn(() => false);
      extern.isPosition = fn(() => true) as any;
      extern.isOnDependent = fn(() => false);

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isPosition true, key missing
    it("isPosition true with no matching key returns false", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = fn(() => new Set()) as any;
      extern.isEventFilter = fn(() => false);
      extern.isPosition = fn(() => true) as any;
      extern.isOnDependent = fn(() => false);

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isOnDependent true, key exists
    it("isOnDependent true with matching key returns true", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = fn(() => new Set(["on"])) as any;
      extern.isEventFilter = fn(() => false);
      extern.isPosition = fn(() => false) as any;
      extern.isOnDependent = fn(() => true);

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isOnDependent true, key missing
    it("isOnDependent true with no matching key returns false", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = fn(() => new Set()) as any;
      extern.isEventFilter = fn(() => false);
      extern.isPosition = fn(() => false) as any;
      extern.isOnDependent = fn(() => true);

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // none of the filters match
    it("returns true if none of the filters match", () => {
      const attrData = { name: "otherAttr" };
      extern.getAttributes = fn(() => new Set()) as any;
      extern.isEventFilter = fn(() => false);
      extern.isPosition = fn(() => false) as any;
      extern.isOnDependent = fn(() => false);

      expect(isAllowedAttr(attrData)).toBe(true);
    });
  });
}
/* v8 ignore stop */
