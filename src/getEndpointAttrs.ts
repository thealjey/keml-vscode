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
 *
 * @example
 * ```ts
 * const makeGetAttr = getEndpointAttr("GET");
 *
 * const idAttr = makeGetAttr("endpoint");
 *
 * console.log(idAttr.name); // "endpoint"
 * console.log(idAttr.description.value.includes("GET")); // true
 * ```
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
 *
 * @example
 * ```ts
 * const attrs = getEndpointAttrs(["POST", ["create", "update"]]);
 *
 * console.log(attrs[0].name); // "create"
 * console.log(attrs[1].description.kind); // "markdown"
 * ```
 */
export const getEndpointAttrs = ([method, names]: [string, string[]]) =>
  names.map(getEndpointAttr(method));
