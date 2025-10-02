import { IValueData, MarkupKind } from "vscode-html-languageservice";

/**
 * Generates metadata for a named **event action** that can be referenced
 * in `on:<event>`, `on`, or `reset` attributes in a KEML/extended HTML context.
 *
 * Event actions represent **global signals** that elements can subscribe to.
 * Triggering an action does not perform any operation by itself — instead,
 * all elements that have subscribed to the action will respond accordingly.
 *
 * The returned object conforms to {@link IValueData}, making it compatible
 * with the VS Code HTML language service for hover tooltips and IntelliSense.
 *
 * @param name - The name of the event action.
 *
 * @returns An {@link IValueData} object describing the event action, including
 *          a Markdown-formatted description with usage examples.
 *
 * @example
 * ```ts
 * const actionData = getEventValue("save");
 *
 * console.log(actionData.name); // "save"
 * console.log(actionData.description.kind); // "markdown"
 * ```
 */
export const getEventValue = (name: string) =>
  ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Event Action**: \`${name}\`

* Can be used as a value for \`on:<event>\`, \`on\`, or \`reset\` attributes.
* Represents a **named signal**: initiating it does nothing by itself, but any
  subscribed element can respond.
* Multiple elements can trigger the same action, and multiple elements can
  subscribe to it.
* Actions are **global on the page**; all subscribers respond when it is
  triggered.

💡 Example:
\`\`\`html
<button on:click="${name}">Trigger</button>
<div on="${name}" get="/data"></div>
<form reset="${name}"></form>
\`\`\`

→ Clicking the button triggers the \`${name}\` action.${"  "}
→ The \`div\` sends a request to \`/data\`.${"  "}
→ The \`form\` resets itself.`,
    },
  } satisfies IValueData);
