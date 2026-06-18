import type { IAttributeData } from "vscode-html-languageservice";
import { actions } from "./actions.mts";

/**
 * Returns the original attribute along with any additional attributes
 * contributed by registered actions.
 */
export const provideActionAttributes = (
  attr: IAttributeData,
): IAttributeData[] => [
  attr,
  ...actions.flatMap(action => action.provideAttributes(attr)),
];
