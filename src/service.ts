import {
  getDefaultHTMLDataProvider,
  getLanguageService,
  IAttributeData,
  IValueData,
  newHTMLDataProvider,
} from "vscode-html-languageservice";
import { getLanguageIds } from "./configure";
import { customData } from "./customData";
import { expandEventAttr } from "./expandEventAttr";
import { getEventDefinitions } from "./getEventDefinitions";
import { getEventValue } from "./getEventValue";
import { getResultDefinitions } from "./getResultDefinitions";
import { getResultValue } from "./getResultValue";
import { getStateDefinitions } from "./getStateDefinitions";
import { getStateValue } from "./getStateValue";
import { isAllowedAttr } from "./isAllowedAttr";
import { isEventReference } from "./isEventReference";
import { isResultReference } from "./isResultReference";
import { isStateReference } from "./isStateReference";
import { mergeDefinitions } from "./mergeDefinitions";
import { provideActionValues } from "./provideActionValues";

const defaultProvider = getDefaultHTMLDataProvider();
const staticProvider = newHTMLDataProvider("keml", customData);
const providedTags = mergeDefinitions(
  staticProvider.provideTags(),
  defaultProvider.provideTags()
);
const providedValues = new Map<string, Map<string, IValueData[]>>();
const providedAttributes = new Map<string, IAttributeData[]>();

/**
 * Provides a fully configured HTML language service with custom data
 * integration for completion, hover, and validation support.
 *
 * This service combines static custom data (tags, attributes, and values)
 * with the default HTML data provider. It supports dynamic action-based
 * attributes, and ensures only allowed attributes are exposed to the editor.
 *
 * The service handles:
 * - Merging custom tags and attributes with default HTML tags.
 * - Expanding event attributes.
 * - Providing dynamic action values for completion.
 * - Filtering attributes according to allowed usage rules.
 *
 * @remarks
 * Uses `vscode-html-languageservice` APIs:
 * - `getLanguageService` to create the service instance.
 * - `newHTMLDataProvider` for static custom data.
 * - `mergeDefinitions` to combine static and default tags/values.
 *
 * Provides methods for:
 * - `provideTags()` → merged tags from custom and default providers.
 * - `provideAttributes(tag)` → merged, expanded, and filtered attributes.
 * - `provideValues(tag, attribute)` → merged static and default values, or
 *   dynamically generated action values.
 *
 * @example
 * ```ts
 * import { service } from "./service";
 *
 * const completions = service.doComplete(htmlDoc, position);
 * console.log(completions);
 * ```
 */
export const service = getLanguageService({
  useDefaultDataProvider: false,

  customDataProviders: [
    {
      getId: staticProvider.getId.bind(staticProvider),

      isApplicable: languageId => getLanguageIds().includes(languageId),

      provideTags: () => providedTags,

      provideValues: (tag, attribute) => {
        if (isEventReference(attribute)) {
          return provideActionValues(getEventDefinitions, getEventValue);
        }

        if (isStateReference(attribute)) {
          return provideActionValues(getStateDefinitions, getStateValue);
        }

        if (isResultReference(attribute)) {
          return provideActionValues(getResultDefinitions, getResultValue);
        }

        let tagged = providedValues.get(tag);

        if (!tagged) {
          providedValues.set(tag, (tagged = new Map()));
        }

        let attributed = tagged.get(attribute);

        if (!attributed) {
          tagged.set(
            attribute,
            (attributed = mergeDefinitions(
              staticProvider.provideValues(tag, attribute),
              defaultProvider.provideValues(tag, attribute)
            ))
          );
        }

        return attributed;
      },

      provideAttributes: tag => {
        let tagged = providedAttributes.get(tag);

        if (!tagged) {
          providedAttributes.set(
            tag,
            (tagged = mergeDefinitions(
              staticProvider.provideAttributes(tag),
              defaultProvider.provideAttributes(tag)
            ).flatMap(expandEventAttr))
          );
        }

        return tagged.filter(isAllowedAttr);
      },
    },
  ],
});
