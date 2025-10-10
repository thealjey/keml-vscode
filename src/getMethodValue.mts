import { IValueData, MarkupKind } from "vscode-html-languageservice";

/**
 * Generates metadata for an HTTP method value that can be used with the
 * `method` attribute on elements that trigger requests (e.g., via `on` or
 * `fetch`-like behaviors).
 *
 * The returned object conforms to {@link IValueData}, making it compatible
 * with the VS Code HTML language service for hover tooltips and IntelliSense.
 *
 * @param name - The name of the HTTP method (e.g., `"GET"`, `"POST"`, `"PUT"`).
 *
 * @returns An {@link IValueData} object describing the method value, including
 *          a Markdown-formatted description with usage instructions.
 */
export const getMethodValue = (name: string): IValueData => ({
  name,
  description: {
    kind: MarkupKind.Markdown,
    value: `**Value**: \`${name}\`

* Can be used as a value for the \`method\` attribute on elements with an \`on\`
  attribute.
* Overrides the HTTP method used for the request triggered by the element.
* Method determination follows this order:
  1. Default is \`GET\`.
  2. Attributes \`post\`, \`put\`, or \`delete\` are checked **in order**, and
     the **first one found** overrides the default.
  3. The \`method\` attribute, if present, **finally overrides** any previous
     determination.

💡 Example:
\`\`\`html
<input on="loadData" src="/todos" method="${name}">
\`\`\`
→ The request triggered by this element uses the ${name} method.`,
  },
});

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getMethodValue", () => {
    it("returns an object with correct shape and name", () => {
      const result = getMethodValue("foo");

      expect(result).toHaveProperty("name", "foo");
      expect(result).toHaveProperty("description");

      expect(result.description).toHaveProperty("kind");
      expect(result.description).toHaveProperty("value");

      expect((result.description as any).kind).toBe(MarkupKind.Markdown);
    });
  });
}
/* v8 ignore stop */
