import type { IAttributeData } from "vscode-html-languageservice";
import { filterActionAttributes } from "../action/filterActionAttributes.mts";
import { provideActionAttributes } from "../action/provideActionAttributes.mts";
import { mergeDefinitions } from "./mergeDefinitions.mts";
import { defaultProvider, staticProvider } from "./provider.mts";

export const providedAttributes = new Map<string, IAttributeData[]>();

/**
 * Returns available attributes for an HTML tag.
 *
 * Includes attributes from static and default sources, with additional
 * action-based extensions applied.
 */
export const provideAttributes = (tag: string) => {
  let tagged = providedAttributes.get(tag);

  if (!tagged) {
    providedAttributes.set(
      tag,
      (tagged = mergeDefinitions(
        staticProvider
          .provideAttributes(tag)
          .flatMap(provideActionAttributes, true),
        defaultProvider
          .provideAttributes(tag)
          .flatMap(provideActionAttributes, false),
      )),
    );
  }

  return tagged.filter(filterActionAttributes);
};
