import type { IValueData } from "vscode-html-languageservice";
import { actions, baseName } from "../action/actions.mts";
import { provideActionValues } from "../action/provideActionValues.mts";
import { mergeDefinitions } from "./mergeDefinitions.mts";
import { defaultProvider, staticProvider } from "./provider.mts";

export const providedValues = new Map<string, Map<string, IValueData[]>>();

/**
 * Returns value suggestions for a tag attribute.
 *
 * The returned values may come from action-based providers or predefined value
 * sources.
 */
export const provideValues = (tag: string, attribute: string) => {
  for (const action of actions) {
    if (action.isInput(attribute)) {
      return provideActionValues(action);
    }
  }

  let tagged = providedValues.get(tag);

  if (!tagged) {
    providedValues.set(tag, (tagged = new Map()));
  }

  let attributed = tagged.get(attribute);

  if (!attributed) {
    const name = baseName(attribute);
    const staticValues = staticProvider.provideValues(tag, name);
    tagged.set(
      attribute,
      (attributed =
        name === attribute ? staticValues : (
          mergeDefinitions(
            staticValues,
            defaultProvider.provideValues(tag, name),
          )
        )),
    );
  }

  return attributed;
};
