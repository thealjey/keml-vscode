import type { IAttributeData } from "vscode-html-languageservice";
import { actions } from "./actions.mts";
import { getNode } from "./data.mts";

/**
 * Filters attributes according to action-defined rejection rules for the
 * current node context.
 */
export const filterActionAttributes = ({ name }: IAttributeData) =>
  !actions.some(action => action.rejectAttribute(getNode(), name));
