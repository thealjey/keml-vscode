import { IAttributeData } from "vscode-html-languageservice";
import { getAttributes } from "./data.mts";
import { isEventFilter } from "./isEventFilter.mts";
import { isMeasure } from "./isMeasure.mts";
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
        attributes.has(`x-on${name.slice(name.indexOf(":"))}`) ||
        attributes.has(
          `link:on${name.slice(name.indexOf(":", name.indexOf(":") + 1))}`,
        )
    : extern.isPosition(name) ?
      attributes.has("render") ||
      attributes.has("x-render") ||
      attributes.has("link:render")
    : extern.isScrollDependent(name) ?
      attributes.has("scroll") ||
      attributes.has("x-scroll") ||
      attributes.has("link:scroll")
    : extern.isMeasure(name) ?
      attributes.has("ref:width") ||
      attributes.has("x-ref:width") ||
      attributes.has("link:ref:width") ||
      attributes.has("ref:height") ||
      attributes.has("x-ref:height") ||
      attributes.has("link:ref:height")
    : extern.isSseDependent(name) ?
      attributes.has("on") ||
      attributes.has("x-on") ||
      attributes.has("link:on") ||
      attributes.has("sse") ||
      attributes.has("x-sse") ||
      attributes.has("link:sse")
    : extern.isOnDependent(name) ?
      attributes.has("on") ||
      attributes.has("x-on") ||
      attributes.has("link:on")
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
  isMeasure,
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(false);
    });

    // isMeasure true, key exists
    it("isMeasure true with matching key returns true", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = (() => new Set(["ref:width"])) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isMeasure = (() => true) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });

    // isMeasure true, key missing
    it("isMeasure true with no matching key returns false", () => {
      const attrData = { name: "posAttr" };
      extern.getAttributes = (() => new Set()) as any;
      extern.isEventFilter = () => false;
      extern.isPosition = (() => false) as any;
      extern.isScrollDependent = (() => false) as any;
      extern.isMeasure = (() => true) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
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
      extern.isMeasure = (() => false) as any;
      extern.isSseDependent = () => false;
      extern.isOnDependent = () => false;

      expect(isAllowedAttr(attrData)).toBe(true);
    });
  });
}
/* v8 ignore stop */
