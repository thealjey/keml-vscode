import { type IAttributeData, MarkupKind } from "vscode-html-languageservice";

/**
 * Creates metadata for an event modifier attribute used to conditionally gate
 * execution of corresponding event-driven actions.
 */
export const getEventModifier = (name: string): IAttributeData => ({
  name: `event:${name}`,
  description: {
    kind: MarkupKind.Markdown,
    value: `**Attribute**: \`event:${name}\`

* Defines **conditions** that must be satisfied for \`on:${name}\` actions.
* Accepts a **comma-separated list** of \`key=value\` pairs.

Condition rules:
1. \`key=value\` → matches when \`String(event[key]) === String(value)\`
   * Whitespace around \`=\` or the value is ignored
     → \`key=value\`, \`key = value\`, \`key=   value\` are equivalent
2. \`key\` (no \`=\`) → matches when \`!!event[key]\` is truthy
3. \`key=\` (empty value) → matches when \`String(event[key]) === ""\`

* If **any pair fails**, the actions blocked.`,
  },
});
