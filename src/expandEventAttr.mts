import { IAttributeData } from "vscode-html-languageservice";
import { getEventAttrs } from "./getEventAttrs.mts";

/**
 * Expands a single event attribute into multiple attributes if applicable.
 *
 * @param attrData - The attribute data to potentially expand.
 * @returns An array of attributes if expanded, otherwise the original attribute
 *          data.
 */
export const expandEventAttr = (attrData: IAttributeData) => {
  const { name } = attrData;

  return name.length > 2 &&
    name.charCodeAt(0) === 111 &&
    name.charCodeAt(1) === 110 &&
    name.charCodeAt(2) !== 58
    ? extern.getEventAttrs(name.slice(2)).concat(attrData)
    : attrData;
};

let extern = { getEventAttrs };

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

  describe("expandEventAttr", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns concat of getEventAttrs result and attrData when name starts with 'on' and third char is not ':'", () => {
      const mockAttr = { name: "onclick" } as IAttributeData;
      const mockGetEventAttrs = fn(() => [
        { name: "mocked" } as IAttributeData,
      ]);
      extern.getEventAttrs = mockGetEventAttrs;

      const result = expandEventAttr(mockAttr);

      expect(mockGetEventAttrs).toHaveBeenCalledOnce();
      expect(mockGetEventAttrs).toBeCalledWith("click"); // corrected
      expect(result).toEqual([{ name: "mocked" } as IAttributeData, mockAttr]);
    });

    it("returns attrData directly when name is too short", () => {
      const shortAttr = { name: "o" } as IAttributeData;
      const result = expandEventAttr(shortAttr);
      expect(result).toBe(shortAttr);
    });

    it("returns attrData directly when first char is not 'o'", () => {
      const attr = { name: "abc" } as IAttributeData;
      const result = expandEventAttr(attr);
      expect(result).toBe(attr);
    });

    it("returns attrData directly when third char is ':'", () => {
      const attr = { name: "on:" } as IAttributeData;
      const result = expandEventAttr(attr);
      expect(result).toBe(attr);
    });
  });
}
/* v8 ignore stop */
