import { IAttributeData } from "vscode-html-languageservice";
import { getAttributes } from "./data.mts";
import { isEventFilter } from "./isEventFilter.mts";
import { isOnDependent } from "./isOnDependent.mts";
import { isPosition } from "./isPosition.mts";
import { isScrollDependent } from "./isScrollDependent.mts";
import { isSseDependent } from "./isSseDependent.mts";

/**
 * Determines whether an attribute is allowed in the current context.
 *
 * @param attrData - The attribute data to check.
 * @returns True if the attribute is allowed, otherwise false.
 */
export const isAllowedAttr = (attrData: IAttributeData) => {
  const { name } = attrData;
  const attributes = extern.getAttributes();

  return (
    extern.isEventFilter(name) ?
      attributes.has(`on${name.slice(name.indexOf(":"))}`) ||
        attributes.has(`x-on${name.slice(name.indexOf(":"))}`)
    : extern.isPosition(name) ?
      attributes.has("render") || attributes.has("x-render")
    : extern.isScrollDependent(name) ?
      attributes.has("scroll") || attributes.has("x-scroll")
    : extern.isSseDependent(name) ?
      attributes.has("on") ||
      attributes.has("x-on") ||
      attributes.has("sse") ||
      attributes.has("x-sse")
    : extern.isOnDependent(name) ?
      attributes.has("on") || attributes.has("x-on")
    : true
  );
};

let extern = {
  getAttributes,
  isEventFilter,
  isSseDependent,
  isOnDependent,
  isPosition,
  isScrollDependent,
};

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect, afterAll } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("isAllowedAttr", () => {
    afterAll(() => {
      extern = origExtern;
    });

    // isEventFilter true, key exists
    it("isEventFilter true with matching key returns true", () => {
      const attrData = { name: "event:click" };
      extern.getAttributes = (() => new Set(["on:click"])) as any;
      extern.isEventFilter = () => true;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isEventFilter true, key missing
    it("isEventFilter true with no matching key returns false", () => {
      const attrData = { name: "event:click" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => true;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isPosition true, key exists
    it("isPosition true with matching key returns true", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = (() => new Set(["render"])) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => true) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isPosition true, key missing
    it("isPosition true with no matching key returns false", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => true) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isScrollDependent true, key exists
    it("isScrollDependent true with matching key returns true", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = (() => new Set(["scroll"])) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => true) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isScrollDependent true, key missing
    it("isScrollDependent true with no matching key returns false", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => true) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isOnDependent true, key exists
    it("isOnDependent true with matching key returns true", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = (() => new Set(["on"])) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => true;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isOnDependent true, key missing
    it("isOnDependent true with no matching key returns false", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => true;

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isSseDependent true, key exists
    it("isSseDependent true with matching key returns true", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = (() => new Set(["on"])) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => true;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isSseDependent true, key exists
    it("isSseDependent true with matching key returns true", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = (() => new Set(["sse"])) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => true;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isSseDependent true, key missing
    it("isSseDependent true with no matching key returns false", () => {
      const attrData = { name: "onAttr" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => true;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // none of the filters match
    it("returns true if none of the filters match", () => {
      const attrData = { name: "otherAttr" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });
  });
}
/* v8 ignore stop */
