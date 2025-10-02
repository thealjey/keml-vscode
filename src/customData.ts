import { HTMLDataV1, MarkupKind } from "vscode-html-languageservice";
import { getEndpointAttrs } from "./getEndpointAttrs";
import { getEventAttrs } from "./getEventAttrs";
import { getMethodValue } from "./getMethodValue";

const customEvents = ["conceal", "navigate", "result", "reveal"];
const methods = {
  GET: ["href", "action", "src", "get"],
  POST: ["post"],
  PUT: ["put"],
  DELETE: ["delete"],
};
const valueTags = ["input", "select", "textarea"];
const validityTags = valueTags.concat([
  "form",
  "button",
  "output",
  "object",
  "fieldset",
]);

/**
 * `customData` provides HTML metadata for the VSCode HTML language service.
 *
 * Includes:
 * - `globalAttributes`: Attributes available on any element.
 * - `tags`: Tag-specific attributes for common elements like.
 * - `valueSets`: Predefined sets of allowed values for certain attributes:
 *   - `position` → how server responses are applied to elements.
 *   - `redirect` → navigation behavior on event triggers.
 *   - `method` → HTTP method overrides.
 *
 * Each attribute or value includes detailed Markdown documentation for:
 * - Hover tooltips
 * - Completion items
 * - Validation within VSCode.
 */
export const customData: HTMLDataV1 = {
  version: 1.1,
  globalAttributes: customEvents
    .flatMap(getEventAttrs)
    .concat(Object.entries(methods).flatMap(getEndpointAttrs), [
      {
        name: "on",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`on\`

* Subscribes the element to a **named event action**.
* The action may be triggered by this element or any other element on the page.
* Multiple elements can subscribe to the same event action.
* When triggered, the element performs its default behavior (e.g., sends a
  request or executes other KEML-defined effects) if applicable.

💡 Example:
\`\`\`html
<button on:click="save">Save</button>
<div on="save"></div>
\`\`\`
→ Clicking the button triggers the \`save\` event action on the div.`,
        },
      },
      {
        name: "reset",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`reset\`

Subscribes the element to a single action, just like \`on\`, but instead of
sending a request or performing a redirect, it calls the element's \`reset()\`
method.

- Can be used on forms, form fields, or any element that implements a compatible
  \`reset(): void\` method.
- The reset happens **immediately**, without being affected by \`debounce\` or
  \`throttle\`.
- Works with any action, including those initiated by other elements.

💡 Example:
\`\`\`html
<button on:click="resetForm">click me</button>
<form reset="resetForm"></form>
\`\`\`
`,
        },
      },
      {
        name: "render",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`render\`

* Subscribes the element to a **result action** initiated by another element's
  network request.
* Can be used on any element, including the one that triggered the request.
* When the specified action fires, this element will update its contents
  according to the server response.
* Useful for responding to \`result\` or \`error\` actions triggered by other
  elements.
* Multiple elements subscribing to the same result action will render the
  **same server response**.

💡 Example:
\`\`\`html
<div render="userCount"></div>
\`\`\`
`,
        },
      },
      {
        name: "key",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`key\`

* Uniquely identifies an element among its **sibling DOM elements**.
* Helps the renderer efficiently update the DOM by minimizing unnecessary
  re-renders.
* Especially useful for elements whose positions or order may change between
  server responses.
  * If sibling elements are all identical in shape, keys are generally
    unnecessary even if their order changes.
* Keys do **not** need to be globally unique, only unique among sibling
  elements.

💡 Example:
\`\`\`html
<div key="notification" class="info">Notification text</div>
<table key="table">
  <!-- heavy DOM with many rows -->
</table>
\`\`\`
→ These keys allow the renderer to recognize the same elements between
  responses, improving performance when sibling elements differ.`,
        },
      },
      {
        name: "if:intersects",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:intersects\`

* Can be used on **any element**.
* Subscribes the element to a **state action** that turns ON when the element
  **intersects the viewport** and OFF when it leaves the viewport.
* Any attribute prefixed with \`x-\` will be applied when the state is ON and
  reverted when the state is OFF.

💡 Example:
\`\`\`html
<p if:intersects="canSee"></p>
<br>
<br>
<br>
<div if="canSee" x-style="display: none">out of viewport</div>
<div if="canSee" style="display: none" x-style>in the viewport</div>
\`\`\`
→ The first div is visible when the paragraph is out of view, and the second div
  is visible when it intersects the viewport.`,
        },
      },
      {
        name: "if:loading",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:loading\`

* Can only be used on elements that **send requests**
  (have an \`on\` attribute).
* Declares one or more **state actions** to turn ON immediately **before** a
  request starts, and OFF immediately **after** the request completes.
* Supports **space-separated state action names**.
* Other elements can subscribe to these state actions using the \`if\`
  attribute.
* Any attribute prefixed with \`x-\` on subscriber elements will temporarily
  override the normal value while the state is ON.

💡 Example:
\`\`\`html
<input on="loadData" get="/data" if:loading="isLoading">
<div if="isLoading" x-style="opacity: 0.5">Loading...</div>
\`\`\`
→ The \`isLoading\` state turns ON before the request and OFF after it
  completes, temporarily applying the reactive attributes on subscriber
  elements.`,
        },
      },
      {
        name: "if:error",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:error\`

* Can only be used on elements that **send requests**
  (have an \`on\` attribute).
* Declares one or more **state actions** to turn OFF immediately **before** a
  request starts, and ON if the request **fails** (status ≥ 400).
* Supports **space-separated state action names**.
* Other elements can subscribe to these state actions using the \`if\`
  attribute.
* Any attribute prefixed with \`x-\` on subscriber elements will temporarily
  override the normal value while the state is ON.

💡 Example:
\`\`\`html
<input on="loadData" get="/non-existent" if:error="isError">
<div if="isError" x-style="color: red">Error occurred</div>
\`\`\`
→ The \`isError\` state turns ON if the request fails, temporarily applying
  reactive attributes on subscriber elements.`,
        },
      },
      {
        name: "if",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if\`

* Can be used on **any element**.
* Subscribes the element to a **single state action**, including ones triggered
  by the same element.
* Any attribute prefixed with \`x-\` will be applied when the state is ON and
  reverted when the state is OFF.

💡 Example:
\`\`\`html
<button if="isActive" x-style="opacity: 0.5">Click me</button>
<div if="isActive" style="display: none" x-style>Active</div>
\`\`\`
→ Both elements respond to the \`isActive\` state action: the button changes
  style and the div toggles visibility when the state is ON.`,
        },
      },
      {
        name: "position",
        valueSet: "position",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`position\`

* Controls **how an element renders** the server response when subscribed to a
  result action.
* Can be used on any element with a \`render\` attribute.
* Determines which part of the DOM is replaced or where the response is
  inserted.

⚙️ Available values:
- \`replaceChildren\` (default) → replaces all of the element's children with
  the server response.
- \`replaceWith\` → replaces the element itself with the server response.
- \`before\` → inserts the server response directly **before** the element.
- \`after\` → inserts the server response directly **after** the element.
- \`prepend\` → prepends the server response as the **first child** of the
  element.
- \`append\` → appends the server response as the **last child** of the element.

💡 Example:
\`\`\`html
<span position="replaceWith" render="userCount"></span>
<div position="prepend" render="userCount"></div>
\`\`\`
→ The span replaces itself and the div prepends the same server response
  whenever the \`userCount\` action fires.`,
        },
      },
      {
        name: "debounce",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`debounce\`

* Specifies a **delay in milliseconds** for this element to respond to an event
  action.
* While debounced, repeated triggers of the same action on this element are
  ignored until the delay expires.
* Useful for preventing rapid repeated requests.

💡 Example:
\`\`\`html
<div on="search" debounce="300"></div>
\`\`\`
→ This element will respond to the \`search\` action at most once every 300ms,
  even if the action fires multiple times.`,
        },
      },
      {
        name: "throttle",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`throttle\`

* Specifies a **minimum interval in milliseconds** between consecutive responses
  of this element to an event action.
* While throttled, repeated triggers of the same action on this element are
  ignored until the interval has passed.
* Useful for preventing rapid repeated requests.

💡 Example:
\`\`\`html
<div on="search" throttle="300"></div>
\`\`\`
→ This element will respond to the \`search\` action
  **at most once every 300ms**, even if the action fires multiple times.`,
        },
      },
      {
        name: "method",
        valueSet: "method",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`method\`

* Overrides the default HTTP method for a request triggered by this element's
  event action.
* Normally an HTML form attribute, KEML makes it available on **any element with
  an \`on\` attribute**.
* Method determination follows this order:
  1. Default is \`GET\`.
  2. Attributes \`post\`, \`put\`, or \`delete\` are checked **in order**, and
     the **first one found** overrides the default.
  3. The \`method\` attribute, if present, **finally overrides** any previous
     determination.

💡 Example:
\`\`\`html
<input on="doStuff" post="/foo" method="PUT">
\`\`\`
→ Sends a PUT request to "/foo", overriding the default POST method.`,
        },
      },
      {
        name: "name",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`name\`

* Assigns a **name** to this element for use in requests originating from this
  element itself.
* Normally a form field attribute, KEML makes it available on **any element with
  an \`on\` attribute**.
* For non-form elements, the value is **only included** if the element itself
  sends the request.
  Form fields behave as usual and are included when their form is serialized.

💡 Example:
\`\`\`html
<div name="lastName" value="Doe" on="save"></div>
\`\`\`
→ If this div itself sends a request, the payload will include
  \`lastName=Doe\`.`,
        },
      },
      {
        name: "credentials",
        valueSet: "v",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`credentials\`

* When present, sets \`XMLHttpRequest.withCredentials\` to \`true\` for requests
  triggered by this element.
* Makes cross-origin requests include credentials such as cookies, authorization
  headers, or TLS client certificates.
* Can be set with or without a value; presence alone is enough.

💡 Example:
\`\`\`html
<div on="save" post="/data" credentials></div>
\`\`\`
→ The request to "/data" will include credentials like cookies.`,
        },
      },
      {
        name: "result",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`result\`

* Fires **one or more result actions** based on the network response status:
  * fired if \`status < 400\` (success)
* Multiple actions can be listed **space-separated**; all reference the same
  network response.
* Other elements can **subscribe** to these actions using the \`render\`
  attribute.

💡 Example:
\`\`\`html
<input on="save" post="/todos" result="todoList highlight">
<div render="todoList"></div>
\`\`\`
→ Triggers both \`todoList\` and \`highlight\` actions. Other elements with
  \`render="todoList"\` or \`render="highlight"\` will respond accordingly.`,
        },
      },
      {
        name: "error",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`error\`

* Fires **one or more result actions** based on the network response status:
  * fired if \`status >= 400\` (failure)
* Multiple actions can be listed **space-separated**; all reference the same
  network response.
* Other elements can **subscribe** to these actions using the \`render\`
  attribute.

💡 Example:
\`\`\`html
<input on="save" post="/todos" error="todoList highlight">
<div render="todoList"></div>
\`\`\`
→ Triggers both \`todoList\` and \`highlight\` actions. Other elements with
  \`render="todoList"\` or \`render="highlight"\` will respond accordingly.`,
        },
      },
      {
        name: "redirect",
        valueSet: "redirect",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`redirect\`

* Configures how an element with an \`on\` attribute navigates instead of
  sending a network request.
* Accepts one of four values:
  * \`pushState\` → uses the History API to push a new state
    (in-app navigation, can go back)
  * \`replaceState\` → uses the History API to replace the current state
    (in-app navigation, cannot go back)
  * \`assign\` → navigates normally, fully reloading the page
  * \`replace\` → navigates normally, fully reloading the page and replacing the
    current history entry
* URIs are resolved the same way as request endpoints.

💡 Example:
\`\`\`html
<div on="save" get="/dashboard" redirect="pushState"></div>
\`\`\`
→ When triggered, navigates using pushState instead of sending a request.`,
        },
      },
      {
        name: "once",
        valueSet: "v",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`once\`

* Can be added to any element with an \`on\` attribute.
* Automatically removes the \`on\` attribute
  **before starting the request or redirect**.
* Ensures the associated action only runs **once**, even if triggered multiple
  times.

💡 Example:
\`\`\`html
<input on="save" once>
\`\`\`
→ The \`save\` action runs only once; subsequent clicks do nothing.`,
        },
      },
      {
        name: "value",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`value\`

* Assigns a **value** to this element for use in requests originating from this
  element itself.
* Normally a form field attribute, KEML makes it available on **any element with
  an \`on\` attribute**.
* For non-form elements, the value is **only included** if the element itself
  sends the request.
  Form fields behave as usual and are included when their form is serialized.

💡 Example:
\`\`\`html
<div name="lastName" value="Doe" on="save"></div>
\`\`\`
→ If this div itself sends a request, the payload will include
  \`lastName=Doe\`.`,
        },
      },
    ]),
  tags: valueTags
    .map(name => ({
      name,
      attributes: [
        {
          name: "if:value",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Attribute**: \`if:value\`

* Can only be used on **inputs, selects, text areas, and checkboxes**.
* Subscribes the element to a **state action** that turns ON when the element
  has a **non-empty value** and OFF when it is empty.
* Any attribute prefixed with \`x-\` will be applied when the state is ON and
  reverted when the state is OFF.

💡 Example:
\`\`\`html
<input if:value="isNotEmpty" type="text">
<div if="isNotEmpty" x-style="display: none">empty</div>
<div if="isNotEmpty" style="display: none" x-style>not empty</div>
\`\`\`
→ The first div is visible when the input is empty, and the second div is
  visible when it has a value.`,
          },
        },
      ],
    }))
    .concat(
      validityTags.map(name => ({
        name,
        attributes: [
          {
            name: "if:invalid",
            description: {
              kind: MarkupKind.Markdown,
              value: `**Attribute**: \`if:invalid\`

* Can only be used on **forms or form fields**.
* Subscribes the element to a **state action** that turns ON when the element
  becomes **invalid** and OFF when it becomes **valid**.
* Invalid elements do **not** trigger server requests.
* Any attribute on the element prefixed with \`x-\` will be applied when the
  state is ON and reverted when the state is OFF.

💡 Example:
\`\`\`html
<input if:invalid="invalidEmail" type="email">
<div if="invalidEmail" x-style="display: none">valid</div>
<div if="invalidEmail" style="display: none" x-style>invalid</div>
\`\`\`
→ The first div will be visible when the input is valid, and the second div will
  be visible when it is invalid.`,
            },
          },
        ],
      }))
    ),
  valueSets: [
    {
      name: "position",
      values: [
        {
          name: "replaceChildren",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replaceChildren\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Replaces **all children** of the element with the server response. This is the
  default behavior.

💡 Example:
\`\`\`html
<div render="userCount" position="replaceChildren"></div>
\`\`\`
→ The content of the div is replaced with the response whenever "userCount"
  updates.`,
          },
        },
        {
          name: "replaceWith",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replaceWith\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Replaces the **entire element** with the server response.

💡 Example:
\`\`\`html
<span render="userCount" position="replaceWith"></span>
\`\`\`
→ The span element itself is replaced by the server response.`,
          },
        },
        {
          name: "before",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`before\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Inserts the server response directly **before** the element.

💡 Example:
\`\`\`html
<div render="userCount" position="before"></div>
\`\`\`
→ The response is inserted immediately before the div.`,
          },
        },
        {
          name: "after",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`after\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Inserts the server response directly **after** the element.

💡 Example:
\`\`\`html
<div render="userCount" position="after"></div>
\`\`\`
→ The response is inserted immediately after the div.`,
          },
        },
        {
          name: "prepend",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`prepend\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Prepends the server response as the **first child** of the element.

💡 Example:
\`\`\`html
<div render="userCount" position="prepend"></div>
\`\`\`
→ The response is added at the beginning of the div's children.`,
          },
        },
        {
          name: "append",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`append\`

* Can be used as a value for the \`position\` attribute on elements with a
  \`render\` attribute.
* Appends the server response as the **last child** of the element.

💡 Example:
\`\`\`html
<div render="userCount" position="append"></div>
\`\`\`
→ The response is added at the end of the div's children.`,
          },
        },
      ],
    },
    {
      name: "redirect",
      values: [
        {
          name: "pushState",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`pushState\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Uses the **History API** to push a new state without reloading the page.

💡 Example:
\`\`\`html
<div on="navigate" src="/dashboard" redirect="pushState"></div>
\`\`\`
→ Navigates in-app without reloading the page.`,
          },
        },
        {
          name: "replaceState",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replaceState\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Uses the **History API** to replace the current state without reloading the
  page.

💡 Example:
\`\`\`html
<div on="navigate" href="/dashboard" redirect="replaceState"></div>
\`\`\`
→ Replaces the current history entry in-app without reloading.`,
          },
        },
        {
          name: "assign",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`assign\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Performs a **full page navigation** to the target URL using
  \`location.assign()\`.

💡 Example:
\`\`\`html
<div on="navigate" get="/dashboard" redirect="assign"></div>
\`\`\`
→ Loads the dashboard page fully, replacing the current page.`,
          },
        },
        {
          name: "replace",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replace\`

* Can be used as a value for the \`redirect\` attribute on elements with an
  \`on\` attribute.
* Performs a **full page navigation** to the target URL using
  \`location.replace()\`, replacing the current history entry.

💡 Example:
\`\`\`html
<div on="navigate" action="/dashboard" redirect="replace"></div>
\`\`\`
→ Loads the dashboard page fully, replacing the current page and history
  entry.`,
          },
        },
      ],
    },
    { name: "method", values: Object.keys(methods).map(getMethodValue) },
  ],
};
