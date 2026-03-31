import {
  getDefaultHTMLDataProvider,
  getLanguageService,
  IAttributeData,
  IHTMLDataProvider,
  IValueData,
  newHTMLDataProvider,
} from "vscode-html-languageservice";
import { customData } from "./customData.mts";
import { getLanguageIds } from "./data.mts";
import { expandEventAttr } from "./expandEventAttr.mts";
import { getEventDefinitions } from "./getEventDefinitions.mts";
import { getEventValue } from "./getEventValue.mts";
import { getResultDefinitions } from "./getResultDefinitions.mts";
import { getResultValue } from "./getResultValue.mts";
import { getStateDefinitions } from "./getStateDefinitions.mts";
import { getStateValue } from "./getStateValue.mts";
import { isAllowedAttr } from "./isAllowedAttr.mts";
import { isEventReference } from "./isEventReference.mts";
import { isResultReference } from "./isResultReference.mts";
import { isStateReference } from "./isStateReference.mts";
import { mergeDefinitions } from "./mergeDefinitions.mts";
import { provideActionValues } from "./provideActionValues.mts";

const defaultProvider = getDefaultHTMLDataProvider();
const staticProvider = newHTMLDataProvider("keml", customData);
const providedTags = mergeDefinitions(
  staticProvider.provideTags(),
  defaultProvider.provideTags(),
);
const providedValues = new Map<string, Map<string, IValueData[]>>();
const providedAttributes = new Map<string, IAttributeData[]>();

const provider: IHTMLDataProvider = {
  getId: staticProvider.getId.bind(staticProvider),

  /**
   * Determines if the provider applies to a given language.
   *
   * @param languageId Language identifier to check.
   * @returns True if the provider supports the language.
   */
  isApplicable: languageId => extern.getLanguageIds().includes(languageId),

  /**
   * Provides all available HTML tags.
   *
   * @returns Array of tag definitions.
   */
  provideTags: () => providedTags,

  /**
   * Provides the possible values for a given tag attribute.
   *
   * @param tag Tag name.
   * @param attribute Attribute name.
   * @returns Array of allowed values for the attribute.
   */
  provideValues: (tag, attribute) => {
    if (extern.isEventReference(attribute)) {
      return extern.provideActionValues(getEventDefinitions, getEventValue);
    }

    if (extern.isStateReference(attribute)) {
      return extern.provideActionValues(getStateDefinitions, getStateValue);
    }

    if (extern.isResultReference(attribute)) {
      return extern.provideActionValues(getResultDefinitions, getResultValue);
    }

    let tagged = extern.providedValues.get(tag);

    if (!tagged) {
      extern.providedValues.set(tag, (tagged = new Map()));
    }

    let attributed = tagged.get(attribute);

    if (!attributed) {
      tagged.set(
        attribute,
        (attributed = extern.mergeDefinitions(
          extern.staticProvider.provideValues(tag, attribute),
          extern.defaultProvider.provideValues(tag, attribute),
        )),
      );
    }

    return attributed;
  },

  /**
   * Provides the attributes available for a given tag.
   *
   * @param tag Tag name.
   * @returns Array of allowed attributes for the tag.
   */
  provideAttributes: tag => {
    let tagged = extern.providedAttributes.get(tag);

    if (!tagged) {
      extern.providedAttributes.set(
        tag,
        (tagged = extern
          .mergeDefinitions(
            extern.staticProvider.provideAttributes(tag),
            extern.defaultProvider.provideAttributes(tag),
          )
          .flatMap(extern.expandEventAttr)),
      );
    }

    return tagged.filter(extern.isAllowedAttr);
  },
};

export const service = getLanguageService({
  useDefaultDataProvider: false,
  customDataProviders: [provider],
});

let extern = {
  getLanguageIds,
  isEventReference,
  provideActionValues,
  isResultReference,
  isStateReference,
  providedValues,
  mergeDefinitions,
  staticProvider,
  defaultProvider,
  providedAttributes,
  expandEventAttr,
  isAllowedAttr,
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

  describe("HTML Data Provider", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("provideTags returns the precomputed tags", () => {
      const tags = provider.provideTags();
      // precomputed `providedTags` from module
      expect(tags).toBe(providedTags);
    });

    it("isApplicable returns true only for known languageIds", () => {
      extern.getLanguageIds = fn(() => ["keml", "other"]);

      expect(provider.isApplicable("keml")).toBe(true);
      expect(provider.isApplicable("other")).toBe(true);
      expect(provider.isApplicable("unknown")).toBe(false);
    });

    it("provideValues calls provideActionValues for event, state, result attributes", () => {
      const conv = { converted: true };
      extern.isEventReference = fn(() => true) as any;
      extern.provideActionValues = fn(() => [conv]) as any;
      expect(provider.provideValues("tag", "attr")).toEqual([conv]);
      expect(extern.provideActionValues).toHaveBeenCalledWith(
        getEventDefinitions,
        getEventValue,
      );

      extern.isEventReference = fn(() => false) as any;
      extern.isStateReference = fn(() => true) as any;
      expect(provider.provideValues("tag", "attr")).toEqual([conv]);
      expect(extern.provideActionValues).toHaveBeenCalledWith(
        getStateDefinitions,
        getStateValue,
      );

      extern.isStateReference = fn(() => false) as any;
      extern.isResultReference = fn(() => true) as any;
      expect(provider.provideValues("tag", "attr")).toEqual([conv]);
      expect(extern.provideActionValues).toHaveBeenCalledWith(
        getResultDefinitions,
        getResultValue,
      );
    });

    it("provideValues caches merged results for non-reference attributes", () => {
      const merged = ["val1"];
      const staticProvider = { provideValues: fn(() => ["s"]) } as any;
      const defaultProvider = { provideValues: fn(() => ["d"]) } as any;
      extern.isEventReference = fn(() => false) as any;
      extern.isStateReference = fn(() => false) as any;
      extern.isResultReference = fn(() => false) as any;
      extern.mergeDefinitions = fn(() => merged) as any;
      extern.staticProvider = staticProvider;
      extern.defaultProvider = defaultProvider;
      extern.providedValues = new Map();

      expect(provider.provideValues("tag", "attr")).toBe(merged);
      // cached result should be reused
      expect(provider.provideValues("tag", "attr")).toBe(merged);
    });

    it("provideAttributes merges, expands, and filters correctly", () => {
      const merged = [{ name: "a" }, { name: "b" }];
      extern.mergeDefinitions = fn(() => merged) as any;
      extern.staticProvider = { provideAttributes: fn(() => ["s"]) } as any;
      extern.defaultProvider = { provideAttributes: fn(() => ["d"]) } as any;
      extern.expandEventAttr = fn(x => [x]);
      extern.isAllowedAttr = fn(attr => attr.name === "a");
      extern.providedAttributes = new Map();

      const result = provider.provideAttributes("tag");
      expect(result).toEqual([{ name: "a" }]);
      // cached result should be reused
      expect(provider.provideAttributes("tag")).toEqual([{ name: "a" }]);
    });
  });
}
/* v8 ignore stop */
