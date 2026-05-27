import { type IAttributeData, MarkupKind } from "vscode-html-languageservice";

/**
 * Creates attribute metadata for state-based attribute variants using `x-*`
 * prefixes.
 */
export const getStateAttrs = (name: string): IAttributeData[] => [
  {
    name: `x-${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`x-${name}\`

* Used together with \`if\`.
* Any attribute with a name starting with \`x-\` will trade places with its
  unprefixed counterpart while a state condition is \`true\`, and will be
  restored back when it is \`false\`. If a counterpart does not exist, its
  non-existence will also be restored.

Example:
\`\`\`html
<input type="email" if:invalid="foo bar">
<div if="foo" ${name}="value1" x-${name}="value2"></div>
\`\`\`
→ When the \`input\` is valid the \`div\` is
  \`<div ${name}="value1" x-${name}="value2"></div>\`.${"  "}
→ When the \`input\` is invalid the \`div\` is
  \`<div ${name}="value2" x-${name}="value1"></div>\`.`,
    },
  },
];
