import {
  CompletionItem,
  CompletionItemKind,
  MarkdownString,
  Range,
} from "vscode";
import { combineIterators } from "./combineIterators";
import { docs } from "./configure";
import { getExistingActionValue } from "./getExistingActionValue";
import { getStateValue } from "./getStateValue";

/**
 * Adds completion items for all defined or referenced actions across all
 * documents to the provided completions array.
 *
 * Iterates through all documents and collects unique actions using the provided
 * definition and reference getters. For each action found, it retrieves its
 * value data and constructs a `CompletionItem` with associated documentation
 * and insertion range.
 *
 * @param completions - The array to which new `CompletionItem`s will be added.
 * @param definitionsGetter - A function that retrieves a map of action
 *                            definitions from a document.
 * @param referencesGetter - A function that retrieves a map of action
 *                           references from a document.
 * @param range - The `Range` within which the completion should be applied.
 * @param valueGetter - A function that returns the value data object for a
 *                      given action name.
 *
 * @example
 * ```ts
 * const completions: CompletionItem[] = [];
 * addCompletions(
 *   completions,
 *   getStateDefinitions,
 *   getStateReferences,
 *   new Range(0, 0, 0, 0),
 *   getStateValue
 * );
 * console.log(completions.length); // number of unique state actions found
 * ```
 */
export const addCompletions = (
  completions: CompletionItem[],
  definitionsGetter: (cur: ParsedDocument) => Map<string, Range[]>,
  referencesGetter: (cur: ParsedDocument) => Map<string, Range[]>,
  range: Range,
  valueGetter: (name: string) => ReturnType<typeof getStateValue>
) => {
  const done = new Set<string>();
  let action, item, documentation;

  for (const cur of docs.values()) {
    for (action of combineIterators(
      definitionsGetter(cur).keys(),
      referencesGetter(cur).keys()
    )) {
      if (done.has(action)) {
        continue;
      }
      documentation = getExistingActionValue(
        action,
        definitionsGetter,
        valueGetter
      );
      if (!documentation) {
        continue;
      }
      item = new CompletionItem(action, CompletionItemKind.Value);
      item.preselect = true;
      item.insertText = action;
      item.range = range;
      item.documentation = new MarkdownString(documentation.description.value);
      completions.push(item);
      done.add(action);
    }
  }
};
