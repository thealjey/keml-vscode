import { Hover, HoverProvider, MarkdownString } from "vscode";
import { docs, setAttributes } from "./configure";
import { convertHover } from "./convertHover";
import { getAttrAtOffset } from "./getAttrAtOffset";
import { getEventDefinitions } from "./getEventDefinitions";
import { getEventValue } from "./getEventValue";
import { getExistingActionValue } from "./getExistingActionValue";
import { getResultDefinitions } from "./getResultDefinitions";
import { getResultValue } from "./getResultValue";
import { getStateDefinitions } from "./getStateDefinitions";
import { getStateValue } from "./getStateValue";
import { isEventDefinition } from "./isEventDefinition";
import { isResultDefinition } from "./isResultDefinition";
import { isStateDefinition } from "./isStateDefinition";
import { service } from "./service";

/**
 * Provides hover information for HTML documents.
 *
 * Uses the HTML language service to provide standard hover content, and
 * augments it with hover information derived from tracked actions.
 *
 * The hover provider inspects the node and attribute at the cursor
 * position to offer context-aware documentation:
 * - Event definitions (`isEventDefinition`) show the associated event's value
 *   description.
 * - State definitions (`isStateDefinition`) show the associated state's value
 *   description.
 * - Result definitions (`isResultDefinition`) show the associated result's
 *   value description.
 *
 * The provider first attempts to retrieve hover information from the language
 * service. If none exists, it attempts to provide documentation for the
 * attribute value if it corresponds to a known action.
 *
 * @example
 * ```ts
 * import { languages } from "vscode";
 * import { hoverProvider } from "./hoverProvider";
 *
 * languages.registerHoverProvider("html", hoverProvider);
 * ```
 */
export const hoverProvider: HoverProvider = {
  provideHover(doc, position, { isCancellationRequested }) {
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
    setAttributes(node.attributes);

    const hover = service.doHover(textDoc, position, htmlDoc);
    if (hover) {
      return convertHover(hover);
    }

    const range = doc.getWordRangeAtPosition(position, /[^"\s]+/);
    if (!range) {
      return;
    }

    const attr = getAttrAtOffset(textDoc, node, offset);
    if (!attr) {
      return;
    }

    const { name } = attr;
    let definitionsGetter, valueGetter;

    if (isEventDefinition(name)) {
      definitionsGetter = getEventDefinitions;
      valueGetter = getEventValue;
    } else if (isStateDefinition(name)) {
      definitionsGetter = getStateDefinitions;
      valueGetter = getStateValue;
    } else if (isResultDefinition(name)) {
      definitionsGetter = getResultDefinitions;
      valueGetter = getResultValue;
    } else {
      return;
    }

    const documentation = getExistingActionValue(
      doc.getText(range),
      definitionsGetter,
      valueGetter
    );
    if (!documentation) {
      return;
    }

    return new Hover(
      new MarkdownString(documentation.description.value),
      range
    );
  },
};
