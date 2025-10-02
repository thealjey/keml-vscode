import { IValueData, MarkupKind } from "vscode-html-languageservice";

/**
 * Generates metadata for a named **result action** that can be used in
 * `result`, `error`, or `render` attributes in a KEML/extended HTML context.
 *
 * Result actions represent **responses from server requests**. Elements can
 * define result actions (e.g., via `result` or `error`) or subscribe to them
 * (e.g., via `render`) to handle and display server responses.
 *
 * The returned object conforms to {@link IValueData}, making it compatible
 * with the VS Code HTML language service for hover tooltips and IntelliSense.
 *
 * @param name - The name of the result action.
 *
 * @returns An {@link IValueData} object describing the result action, including
 *          a Markdown-formatted description with usage instructions.
 *
 * @example
 * ```ts
 * const resultData = getResultValue("getUserCount");
 *
 * console.log(resultData.name); // "getUserCount"
 * console.log(resultData.description.kind); // "markdown"
 * ```
 */
export const getResultValue = (name: string) =>
  ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Result Action**: \`${name}\`

* Can be used as a value for \`result\`, \`error\`, or \`render\` attributes.
  - \`result\` and \`error\` define a result action on an element that performs
    a request (for successful or failed responses, respectively).
  - \`render\` subscribes an element to a result action to display the server
    response.
* Multiple elements can define or subscribe to the same result action.
* The \`position\` attribute controls how the response is applied to the
  subscribing element.

💡 Example:
\`\`\`html
<button
  get="/user-count"
  on="getUserCount"
  on:click="getUserCount"
  result="${name}"
>Click me</button>
<div render="${name}"></div>
<span position="replaceWith" render="${name}"></span>
\`\`\`

→ The button defines the \`${name}\` result action.${"  "}
→ The \`div\` and \`span\` subscribe to it and render the server response
  according to their \`position\`.`,
    },
  } satisfies IValueData);
