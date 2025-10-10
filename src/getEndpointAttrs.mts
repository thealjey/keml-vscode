import { IValueData, MarkupKind } from "vscode-html-languageservice";

/**
 * Creates a documentation entry for a custom HTML attribute that configures
 * an endpoint route.
 *
 * The returned object conforms to the {@link IValueData} format expected by
 * the `vscode-html-languageservice`. It provides:
 * - The attribute `name`.
 * - A Markdown-formatted description explaining how the attribute value
 *   resolves into a full endpoint URL and how trailing slashes are handled.
 * - The default HTTP method (supplied by the `method` argument).
 *
 * @param method - The HTTP method (e.g., `"GET"`, `"POST"`) to associate with
 *                 the generated attribute. Included in the description text.
 *
 * @returns A function that, given an attribute name, returns an
 *          {@link IValueData} object describing that attribute.
 */
const getEndpointAttr =
  (method: string) =>
  (name: string): IValueData => ({
    name,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`${name}\`

* Configures the **endpoint route** for this element.
* Paths are resolved relative to the current page URL
  (example: https://example.com/blog/posts/):
  * "new" → https://example.com/blog/posts/new/
  * "../archive" → https://example.com/blog/archive/
  * "/home" → https://example.com/home/
  * "index.html" → https://example.com/blog/posts/index.html
* **Trailing slashes are enforced automatically**:
  * File paths → no trailing slash
  * Other paths → single trailing slash added
* By default, requests to this endpoint use the **${method}** HTTP method.
  * Can be overridden with the \`method\` attribute.`,
    },
  });

/**
 * Generates a list of endpoint attribute metadata entries for multiple
 * attribute names associated with a given HTTP method.
 *
 * Each attribute is converted into an {@link IValueData} object with a
 * Markdown description explaining how the attribute configures endpoint
 * routing. The description also documents the default HTTP method.
 *
 * @param tuple - A tuple consisting of:
 *   - `method`: The HTTP method (e.g., `"GET"`, `"POST"`) to associate with
 *     the attributes.
 *   - `names`: An array of attribute names to generate documentation for.
 *
 * @returns An array of {@link IValueData} objects, one for each attribute name.
 */
export const getEndpointAttrs = ([method, names]: [string, string[]]) =>
  names.map(getEndpointAttr(method));

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getEndpointAttrs", () => {
    it("returns array of objects with correct shape and names", () => {
      const attrs = getEndpointAttrs(["GET", ["endpoint", "url"]]);

      expect(attrs).toHaveLength(2);

      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i]!;

        expect(attr).toHaveProperty("name", ["endpoint", "url"][i]);

        expect(attr).toHaveProperty("description");
        expect(attr.description).toHaveProperty("kind");
        expect(attr.description).toHaveProperty("value");

        expect(attr.description).toMatchObject({ kind: MarkupKind.Markdown });
      }
    });
  });
}
/* v8 ignore stop */
