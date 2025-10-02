import { IValueData, MarkupKind } from "vscode-html-languageservice";

/**
 * Generates metadata for a named **state action**.
 *
 * State actions represent **boolean flags** that elements can subscribe to.
 * These states are turned ON or OFF in response to actions, form validity,
 * input values, element visibility, or request results. Multiple elements can
 * subscribe to the same state and react independently using `x-` prefixed
 * attributes (e.g., `x-style`).
 *
 * The returned object conforms to {@link IValueData}, making it compatible
 * with the VS Code HTML language service for hover tooltips and IntelliSense.
 *
 * @param name - The name of the state action.
 *
 * @returns An {@link IValueData} object describing the state action, including
 *          a Markdown-formatted description with usage instructions.
 *
 * @example
 * ```ts
 * const stateData = getStateValue("loading");
 *
 * console.log(stateData.name); // "loading"
 * console.log(stateData.description.kind); // "markdown"
 * ```
 */
export const getStateValue = (name: string) =>
  ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**State Action**: \`${name}\`

* Can be used as a value for \`if\`, \`if:loading\`, \`if:error\`,
  \`if:invalid\`, \`if:value\`, or \`if:intersects\` attributes on elements.
* Represents a **boolean state flag** that is turned ON or OFF in response to
  actions, form validity, input values, visibility, or request results.
* Multiple elements can subscribe to the same state action and update their
  attributes differently using \`x-\` prefixed attributes.
* By default, a state is OFF. Subscribed elements react automatically when it
  changes.

💡 Example:
\`\`\`html
<button get="/data" if:loading="${name}" on="loadData" on:click="loadData">
  Load
</button>
<div if="${name}" x-style="display: none">not loading</div>
<div if="${name}" style="display: none" x-style>loading</div>
\`\`\`

→ Clicking the button turns ON the \`${name}\` state, updating the divs'
  visibility.${"  "}
→ After the request completes, the state turns OFF and the divs revert.`,
    },
  } satisfies IValueData);
