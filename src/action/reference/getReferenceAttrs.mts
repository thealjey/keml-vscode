import { type IAttributeData, MarkupKind } from "vscode-html-languageservice";

/**
 * Creates attribute metadata for a reference-link binding system, defining
 * both source (`ref:*`) and consumer (`link:*`) attributes.
 */
export const getReferenceAttrs = (name: string): IAttributeData[] => [
  {
    name: `ref:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`ref:${name}\`

* Outputs reference actions.
* A reference action can then be consumed with \`link:*\`.

Example:
\`\`\`html
<div ref:${name}="foo bar"></div>
<input link:value="foo">
\`\`\`
→ The \`input\` value is always guaranteed to be equal to the value of the
  \`${name}\` attribute of the \`div\`.`,
    },
  },
  {
    name: `link:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`link:${name}\`

* Accepts a single reference action.
* A reference action is produced with \`ref:*\`.

Example:
\`\`\`html
<input ref:value="foo bar">
<div link:${name}="foo"></div>
\`\`\`
→ The \`div\` \`${name}\` attribute is always guaranteed to be equal to the
  value of the \`input\`.`,
    },
  },
];
