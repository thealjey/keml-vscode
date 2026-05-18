import { IValueData, MarkupKind } from "vscode-html-languageservice";

/**
 * Generates metadata for a named **reference action** that can be used in
 * `reference`, `error`, or `render` attributes in a KEML/extended HTML context.
 *
 * Result actions represent **responses from server requests**. Elements can
 * define reference actions (e.g., via `ref:`) or subscribe to them
 * (e.g., via `render`) to handle and display server responses.
 *
 * The returned object conforms to {@link IValueData}, making it compatible
 * with the VS Code HTML language service for hover tooltips and IntelliSense.
 *
 * @param name - The name of the reference action.
 *
 * @returns An {@link IValueData} object describing the reference action,
 *          including a Markdown-formatted description with usage instructions.
 */
export const getReferenceValue = (name: string): IValueData => ({
  name,
  description: {
    kind: MarkupKind.Markdown,
    value: `**Reference Action**: \`${name}\`

* Can be used as a value for \`ref:\` and \`link:\` attributes.
  - \`ref:\` creates a reference action.
  - \`link:\` binds an attribute to a reference action.
* Multiple elements can define or subscribe to the same reference action.

💡 Example:
\`\`\`html
<input
  type="text"
  ref:value="${name}"
>
<div link:class="${name}"></div>
\`\`\`

→ The \`input\` defines the \`${name}\` reference action.${"  "}
→ The class attribute of the \`div\` points to the value of the \`input\`.`,
  },
});

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getReferenceValue", () => {
    it("returns an object with correct shape and name", () => {
      const result = getReferenceValue("getUserCount");

      expect(result).toHaveProperty("name", "getUserCount");
      expect(result).toHaveProperty("description");

      expect(result.description).toHaveProperty("kind");
      expect(result.description).toHaveProperty("value");

      expect((result.description as any).kind).toBe(MarkupKind.Markdown);
    });
  });
}
/* v8 ignore stop */
