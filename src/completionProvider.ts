import { CompletionItemProvider, Range } from "vscode";
import { addCompletions } from "./addCompletions";
import { docs, setAttributes } from "./configure";
import { convertCompletionItem } from "./convertCompletionItem";
import { getAttrAtOffset } from "./getAttrAtOffset";
import { getEventDefinitions } from "./getEventDefinitions";
import { getEventReferences } from "./getEventReferences";
import { getEventValue } from "./getEventValue";
import { getResultDefinitions } from "./getResultDefinitions";
import { getResultReferences } from "./getResultReferences";
import { getResultValue } from "./getResultValue";
import { getStateDefinitions } from "./getStateDefinitions";
import { getStateReferences } from "./getStateReferences";
import { getStateValue } from "./getStateValue";
import { isEventDefinition } from "./isEventDefinition";
import { isResultDefinition } from "./isResultDefinition";
import { isStateDefinition } from "./isStateDefinition";
import { service } from "./service";

/**
 * Provides completion items for HTML documents.
 *
 * Uses the HTML language service to retrieve standard completions and enhances
 * them with completions from tracked definitions and references.
 *
 * The provider inspects the node and attribute at the cursor position
 * to offer context-aware completions:
 * - Event definitions (`isEventDefinition`) pull completions from event
 *   definitions and references.
 * - State definitions (`isStateDefinition`) pull completions from state
 *   definitions and references.
 * - Result definitions (`isResultDefinition`) pull completions from result
 *   definitions and references.
 *
 * @example
 * ```ts
 * import { languages } from "vscode";
 * import { completionProvider } from "./completionProvider";
 *
 * languages.registerCompletionItemProvider(
 *   "html",
 *   completionProvider,
 *   ...triggerCharacters
 * );
 * ```
 */
export const completionProvider: CompletionItemProvider = {
  provideCompletionItems(doc, position, { isCancellationRequested }) {
    if (isCancellationRequested) {
      return;
    }

    const cur = docs.get(doc.uri.toString());
    if (!cur) {
      return;
    }

    const { textDoc, htmlDoc } = cur;
    const offset = textDoc.offsetAt(position);
    const node = htmlDoc.findNodeAt(offset);
    const attr = getAttrAtOffset(textDoc, node, offset);
    setAttributes(node.attributes);

    const completions = service
      .doComplete(textDoc, position, htmlDoc)
      .items.map(convertCompletionItem);

    if (attr) {
      const { name } = attr;
      const range =
        doc.getWordRangeAtPosition(position, /[^"\s]+/) ??
        new Range(position, position);

      if (isEventDefinition(name)) {
        addCompletions(
          completions,
          getEventDefinitions,
          getEventReferences,
          range,
          getEventValue
        );
      } else if (isStateDefinition(name)) {
        addCompletions(
          completions,
          getStateDefinitions,
          getStateReferences,
          range,
          getStateValue
        );
      } else if (isResultDefinition(name)) {
        addCompletions(
          completions,
          getResultDefinitions,
          getResultReferences,
          range,
          getResultValue
        );
      }
    }

    return completions;
  },
};
