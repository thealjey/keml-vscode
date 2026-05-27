import { type IValueData, MarkupKind } from "vscode-html-languageservice";
import { documents } from "../document/data.mts";
import { t } from "../util/t.mts";
import type { Action } from "./Action.mts";

export const TOKEN_TPL = t`**${"name|11"} Action**: ${"token"}`;

/**
 * Collects action-specific token values from all indexed documents
 * for use in editor completion items.
 */
export const provideActionValues = (action: Action): IValueData[] => {
  const result: IValueData[] = [];

  for (const {
    identifiers: { registry },
  } of documents.values()) {
    for (const token of registry.get(action)!.definitions.keys()) {
      result.push({
        name: token,
        description: {
          kind: MarkupKind.Markdown,
          value: TOKEN_TPL({
            name: action.name,
            token,
          }),
        },
      });
    }
  }

  return result;
};
