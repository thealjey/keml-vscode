import type { IAttributeData } from "vscode-html-languageservice";
import { actions } from "./actions.mts";

/**
 * Returns the original attribute along with any additional attributes
 * contributed by registered actions.
 */
export function provideActionAttributes(
  this: boolean,
  attr: IAttributeData,
): IAttributeData[] {
  const provided = actions.flatMap(action => action.provideAttributes(attr));

  return this ? [attr, ...provided] : provided;
}
