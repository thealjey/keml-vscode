import { type IAttributeData, MarkupKind } from "vscode-html-languageservice";
import { getEventModifier } from "./getEventModifier.mts";

/**
 * Creates attribute metadata for mutation events tied to a specific attribute
 * name, including its companion event modifier.
 */
export const getMutationAttrs = (name: string): IAttributeData[] => [
  {
    name: `on:attr:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`on:attr:${name}\`

* Fires every time the \`${name}\` attribute is added, removed or changed.
* Declares a **list of named actions** to output when the event fires.
* Supports **space-separated action names**.
* May be gated by a companion **\`event:attr:${name}\` modifier** — if
  conditions don't match, no actions are produced.

Example:
\`\`\`html
<div on:attr:class="foo bar"></div>
\`\`\`
→ Outputs \`foo\` and \`bar\` if the class attribute is modified in some way.`,
    },
  },
  getEventModifier(`attr:${name}`),
];
