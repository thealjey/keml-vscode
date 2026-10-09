import {
  getDefaultHTMLDataProvider,
  type HTMLDataV1,
  MarkupKind,
  newHTMLDataProvider,
} from "vscode-html-languageservice";
import { CUSTOM_EVENT_DESCRIPTIONS } from "../action/event/getEventAttrs.mts";
import { mergeDefinitions } from "./mergeDefinitions.mts";

const customData: HTMLDataV1 = {
  version: 1.1,
  globalAttributes: [
    ...Object.entries(CUSTOM_EVENT_DESCRIPTIONS).map(([name, description]) => ({
      name: `on${name}`,
      description: { kind: MarkupKind.Markdown, value: description },
    })),
    ...(
      [
        ["href", "GET"],
        ["action", "GET"],
        ["src", "GET"],
        ["get", "GET"],
        ["post", "POST"],
        ["put", "PUT"],
        ["delete", "DELETE"],
      ] as const
    ).map(([name, method]) => ({
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
    })),
    {
      name: "method",
      valueSet: "method",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`method\`

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
      name: "on",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`on\`

* Consumes an **event action**.
* The action may be produced by this element or any other element on the page.
* Multiple elements can consume the same event action.

💡 Example:
\`\`\`html
<button on:click="save">Save</button>
<div on="save"></div>
\`\`\`
→ Clicking the button outputs the \`save\` event action which is then passed
  along to the div.`,
      },
    },
    {
      name: "stream",
      valueSet: "v",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`stream\`

* Enables response streaming for the \`on\` attribute.

💡 Example:
\`\`\`html
<div on="foo" stream></div>
\`\`\``,
      },
    },
    {
      name: "timeout",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`timeout\`

* Specifies a **timeout in milliseconds**.
* Aborts the request if a response is not received within the specified time.

💡 Example:
\`\`\`html
<div on="search" timeout="300"></div>
\`\`\`
→ This element will wait at most 300ms for a response from the server.`,
      },
    },
    {
      name: "request-mode",
      valueSet: "requestMode",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`request-mode\`

This feature controls how requests and their responses are handled when an
element sends multiple requests before the previous ones have concluded.

Supported options:

* \`parallel\` - (default) all requests are permitted, and responses are
  processed in the order they are received from the server
* \`replace\` - when a new request is made, all currently pending requests are
  cancelled first
* \`ignore\` - if there are pending requests, skip this one
* \`queue\` - like with \`parallel\`, all requests are sent immediately, but
  responses are processed in the same order as the requests were sent, rather
  than in the order the responses arrived
`,
      },
    },
    {
      name: "debounce",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`debounce\`

* Specifies a **delay in milliseconds**.
* Useful for preventing rapid repeated requests.

💡 Example:
\`\`\`html
<div on="search" debounce="300"></div>
\`\`\`
→ This element will respond to the \`search\` action at most once every 300ms,
  even if called multiple times.`,
      },
    },
    {
      name: "throttle",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`throttle\`

* Specifies a **minimum interval in milliseconds**.
* Useful for preventing rapid repeated requests.

💡 Example:
\`\`\`html
<div on="search" throttle="300"></div>
\`\`\`
→ This element will respond to the \`search\` action at most once every 300ms,
  even if called multiple times.`,
      },
    },
    {
      name: "sse",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`sse\`

* Subscribes the element to a **Server-Sent Event**.
* The event is triggered directly by the server with no user interaction
  required.
* The event also carries the sever result with it, so no additional server
  requests are necessary either.

💡 Example:
\`\`\`html
<div sse="hello" src="/events" result="foo bar"></div>
\`\`\`
→ The server triggers the \`hello\` event and the \`foo\` and \`bar\` result
  actions are immediately available.`,
      },
    },
    {
      name: "reset",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`reset\`

Accepts a single event action, just like \`on\`, but instead of sending a
request or performing a redirect, it calls the element's \`reset\` method.

- Can be used on forms, form fields, or any element that implements a compatible
  \`reset(): void\` method.
- The reset happens **immediately**, without being affected by \`debounce\` or
  \`throttle\`.
- Works with any action, including those initiated by other elements.

💡 Example:
\`\`\`html
<button on:click="resetForm">click me</button>
<form reset="resetForm"></form>
\`\`\``,
      },
    },
    {
      name: "clear-timeout",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`clear-timeout\`

Accepts a single event action, just like \`on\`, but instead of sending a
request or performing a redirect, it calls the global \`clearTimeout\` function
with the value of the \`timeoutId\` property of the element instance.

This field can be exposed by a WebComponent or set by \`debounce\`/\`throttle\`.

💡 Example:
\`\`\`html
<form on:submit="foo bar" on="foo" debounce="100" clear-timeout="bar">
  <button>click me</button>
</form>
\`\`\`
→ The form is never submitted, since it is scheduled by \`foo\` and immediately
  unscheduled by \`bar\`.`,
      },
    },
    {
      name: "scroll",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`scroll\`

Accepts a single event action, just like \`on\`, but instead of sending a
request or performing a redirect, it scrolls the element.

### Scrolling attributes

The following attributes modify scrolling behavior:

- \`relative\` — use \`scrollBy\` (relative) instead of \`scroll\` (absolute)
- \`behavior\` — scrolling behavior: \`auto\`, \`instant\`, or \`smooth\`
  (defaults to \`auto\`)
- \`top\` — vertical position or offset; accepts numbers or
  \`start\` / \`center\` / \`end\`
- \`left\` — horizontal position or offset; accepts numbers or
  \`start\` / \`center\` / \`end\`

- Uses \`scroll\` by default. If \`relative\` is present, uses \`scrollBy\`.
- If neither \`top\` nor \`left\` resolve to valid values, no scrolling is
  performed.
- The scroll happens **immediately**, without being affected by \`debounce\` or
  \`throttle\`.
- Works with any action, including those initiated by other elements.

💡 Example:
\`\`\`html
<button on:click="scrollDiv">click me</button>
<div scroll="scrollDiv" top="center" behavior="smooth"></div>

<button on:click="scrollRel">click me</button>
<div scroll="scrollRel" relative top="100"></div>
\`\`\`
→ The first button outputs the \`scrollDiv\` action.${"  "}
→ The \`div\` with \`scroll="scrollDiv"\` receives the action.${"  "}
→ \`top="center"\` resolves to a vertical position within the element.${"  "}
→ \`behavior="smooth"\` enables smooth scrolling.${"  "}
→ The element scrolls using \`scroll\`.

→ The second button outputs the \`scrollRel\` action.${"  "}
→ The \`div\` with \`scroll="scrollRel"\` receives the action.${"  "}
→ \`relative\` switches scrolling to use \`scrollBy\`.${"  "}
→ \`top="100"\` is interpreted as a vertical offset.${"  "}
→ The element scrolls down by 100 pixels.`,
      },
    },
    {
      name: "relative",
      valueSet: "v",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`relative\`

Modifier for \`scroll\` that switches it to use \`scrollBy\` instead of
\`scroll\`.

Part of the scrolling attribute set:
\`scroll\`, \`relative\`, \`behavior\`, \`top\`, \`left\`.`,
      },
    },
    {
      name: "behavior",
      valueSet: "behavior",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`behavior\`

Specifies scrolling behavior for \`scroll\`.

- One of: \`auto\`, \`instant\`, \`smooth\`
- Defaults to \`auto\` if missing or invalid

Part of the scrolling attribute set:
\`scroll\`, \`relative\`, \`behavior\`, \`top\`, \`left\`.`,
      },
    },
    {
      name: "top",
      valueSet: "scrollPosition",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`top\`

Specifies vertical scroll position or offset.

- Accepts numbers or: \`start\`, \`center\`, \`end\`

Part of the scrolling attribute set:
\`scroll\`, \`relative\`, \`behavior\`, \`top\`, \`left\`.
`,
      },
    },
    {
      name: "left",
      valueSet: "scrollPosition",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`left\`

Specifies horizontal scroll position or offset.

- Accepts numbers or: \`start\`, \`center\`, \`end\`

Part of the scrolling attribute set:
\`scroll\`, \`relative\`, \`behavior\`, \`top\`, \`left\`.
`,
      },
    },
    {
      name: "log",
      valueSet: "v",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`log\`

* Enables runtime logging for debugging purposes.
* Outputs information relevant to the element's behavior to the browser console.
* Has no effect in most cases and is safe to use temporarily.
* Intended for debugging and should not be left enabled in production.
* Displays a warning by default to remind you to remove it, which can be
  disabled via the \`keml.warnOnLogAttribute\` setting.

💡 Example:
\`\`\`html
<input event:keydown="key=Enter" log on:keydown="submit">
\`\`\`
→ When a key is pressed, relevant runtime information is logged before the
element processes the event.

💡 Example:
\`\`\`html
<input event:keydown log on:keydown="submit">
\`\`\`
→ When a key is pressed, logging can be used to inspect available runtime
data before defining matching conditions.`,
      },
    },
    {
      name: "measure",
      valueSet: "measure",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`measure\`

Selects which measurement strategy is used for the referenced element size.

Used with:
- \`ref:width\`
- \`ref:height\`

Defaults to \`borderBoxSize\`.`,
      },
    },
    {
      name: "result",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`result\`

* Produces result actions if the network response status is less than 400.

💡 Example:
\`\`\`html
<input on="save" post="/todos" result="todoList highlight">
<div render="todoList"></div>
\`\`\`
→ Outputs both \`todoList\` and \`highlight\` actions. Other elements with
  \`render="todoList"\` or \`render="highlight"\` may consume them.`,
      },
    },
    {
      name: "error",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`error\`

* Produces result actions if the network response status is greater than 399.

💡 Example:
\`\`\`html
<input on="save" post="/todos" error="todoList highlight">
<div render="todoList"></div>
\`\`\`
→ Outputs both \`todoList\` and \`highlight\` actions. Other elements with
  \`render="todoList"\` or \`render="highlight"\` may consume them.`,
      },
    },
    {
      name: "render",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`render\`

* Accepts a single **result action**.
* When called, this element will update its contents according to the server
  result.
* Multiple elements can render the **same server result**.

💡 Example:
\`\`\`html
<div render="userCount"></div>
\`\`\``,
      },
    },
    {
      name: "position",
      valueSet: "position",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`position\`

* Controls **how an element renders** the server result.

⚙️ Available values:
- \`replaceChildren\` (default) → replaces all of the element's children with
  the server result.
- \`replaceWith\` → replaces the element itself with the server result.
- \`before\` → inserts the server result directly **before** the element.
- \`after\` → inserts the server result directly **after** the element.
- \`prepend\` → prepends the server result as the **first child** of the
  element.
- \`append\` → appends the server result as the **last child** of the element.

💡 Example:
\`\`\`html
<span position="replaceWith" render="userCount"></span>
<div position="prepend" render="userCount"></div>
\`\`\`
→ The span replaces itself and the div prepends the same server result
  whenever the \`userCount\` action fires.`,
      },
    },
    {
      name: "key",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`key\`

This attribute serves the same function as it does in frameworks such as
ReactJS: it is a hint to the DOM patcher that helps it distinguish between
otherwise similar-looking elements.

* Use it only for same-tag siblings that can be reordered, inserted, or removed.
* Do not use it to represent text or attribute differences.
* Treat it as stable identity, not as data.

💡 Example:
\`\`\`html
<div key="notification" class="info">Notification text</div>
<div>
  <table>
    <!-- heavy DOM with many rows -->
  </table>
</div>
\`\`\``,
      },
    },
    {
      name: "transition",
      valueSet: "v",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`transition\`

* Enables View Transitions for the \`render\` attribute.

💡 Example:
\`\`\`html
<div render="foo" transition></div>
\`\`\``,
      },
    },
    {
      name: "if:intersects",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`if:intersects\`

* Declares one or more **state actions** to turn ON when the element
  **intersects the viewport** and OFF when it leaves the viewport.

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

* Declares one or more **state actions** to turn ON immediately **before** a
  request starts, and OFF immediately **after** the request completes.

💡 Example:
\`\`\`html
<input on="loadData" get="/data" if:loading="isLoading">
<div if="isLoading" x-style="opacity: 0.5">Loading...</div>
\`\`\``,
      },
    },
    {
      name: "if:error",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`if:error\`

* Declares one or more **state actions** to turn OFF immediately **before** a
  request starts, and ON if the request **fails** (status ≥ 400).

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
      name: "if:timeout",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`if:timeout\`

* Declares one or more **state actions** to turn OFF immediately **before** a
  request starts, and ON if the request **times out** (takes longer than the
  \`timeout\` attribute allows).

💡 Example:
\`\`\`html
<input on="loadData" get="/non-existent" if:timeout="isTimeout">
<div if="isTimeout" x-style="color: yellow">Request timed out</div>
\`\`\`
→ The \`isTimeout\` state turns ON if the request times out, temporarily
  applying reactive attributes on subscriber elements.`,
      },
    },
    {
      name: "if",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`if\`

* Accepts a **single state action**.
* Any attribute prefixed with \`x-\` will be applied when the state action is ON
  and reverted when the state action is OFF.

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
      name: "name",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`name\`

This is just a "name" attribute that normally only form fields have, but
applicable to any element.

💡 Example:
\`\`\`html
<div name="lastName" value="Doe" on="save"></div>
\`\`\``,
      },
    },
    {
      name: "value",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`value\`

This is just a "value" attribute that normally only form fields have, but
applicable to any element.

💡 Example:
\`\`\`html
<div name="lastName" value="Doe" on="save"></div>
\`\`\``,
      },
    },
    {
      name: "credentials",
      valueSet: "v",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`credentials\`

* Makes cross-origin requests include credentials such as cookies, authorization
  headers, or TLS client certificates.

💡 Example:
\`\`\`html
<div on="save" post="http://www.example.com" credentials></div>
\`\`\``,
      },
    },
    {
      name: "redirect",
      valueSet: "redirect",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`redirect\`

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
→ When called, navigates using pushState instead of sending a request.`,
      },
    },
    {
      name: "once",
      valueSet: "v",
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`once\`

* Removes the \`on\` attribute.
* Ensures the associated action only runs **once**, even if triggered multiple
  times.

💡 Example:
\`\`\`html
<input on="save" once>
\`\`\``,
      },
    },
    {
      name: 'h-${1:headerName}="${2:headerValue}"',
      description: {
        kind: MarkupKind.Markdown,
        value: `**Attribute**: \`h-*\`

Adds arbitrary HTTP request headers to outgoing network requests.`,
      },
    },
  ],
  tags: [
    "input",
    "select",
    "textarea",
    "form",
    "button",
    "output",
    "object",
    "fieldset",
  ].map(name => ({
    name,
    attributes: [
      {
        name: "if:invalid",
        description: {
          kind: MarkupKind.Markdown,
          value: `**Attribute**: \`if:invalid\`

* Produces state actions that turn ON when the element becomes **invalid** and
  OFF when it becomes **valid**.
* Invalid elements do **not** trigger server requests.

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
      ...(["input", "select", "textarea"].includes(name) ?
        [
          {
            name: "if:value",
            description: {
              kind: MarkupKind.Markdown,
              value: `**Attribute**: \`if:value\`

* Produces state actions that turn ON when the element has a **non-empty value**
  and OFF when it is empty.

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
        ]
      : []),
    ],
  })),
  valueSets: [
    {
      name: "position",
      values: [
        {
          name: "replaceChildren",
          description: `* Replaces **all children** of the element with the server result. This is the default behavior.`,
        },
        {
          name: "replaceWith",
          description: `* Replaces the **entire element** with the server result.`,
        },
        {
          name: "before",
          description: `* Inserts the server result directly **before** the element.`,
        },
        {
          name: "after",
          description: `* Inserts the server result directly **after** the element.`,
        },
        {
          name: "prepend",
          description: `* Prepends the server result as the **first child** of the element.`,
        },
        {
          name: "append",
          description: `* Appends the server result as the **last child** of the element.`,
        },
      ].map(({ name, description }) => ({
        name,
        description: {
          kind: MarkupKind.Markdown,
          value: `**Value**: \`${name}\`

${description}

💡 Example:
\`\`\`html
<div render="userCount" position="${name}"></div>
\`\`\``,
        },
      })),
    },
    {
      name: "redirect",
      values: [
        {
          name: "pushState",
          description: `* Uses the **History API** to push a new state without reloading the page.`,
        },
        {
          name: "replaceState",
          description: `* Uses the **History API** to replace the current state without reloading the page.`,
        },
        {
          name: "assign",
          description:
            "* Performs a **full page navigation** to the target URL using `location.assign()`.",
        },
        {
          name: "replace",
          description:
            "* Performs a **full page navigation** to the target URL using `location.replace()`, replacing the current history entry.",
        },
      ].map(({ name, description }) => ({
        name,
        description: {
          kind: MarkupKind.Markdown,
          value: `**Value**: \`${name}\`

${description}

💡 Example:
\`\`\`html
<div on="navigate" src="/dashboard" redirect="${name}"></div>
\`\`\``,
        },
      })),
    },
    {
      name: "method",
      values: ["get", "post", "put", "delete"].map(name => ({
        name,
        description: {
          kind: MarkupKind.Markdown,
          value: `**Value**: \`${name}\`

* Overrides the HTTP method.

💡 Example:
\`\`\`html
<input on="loadData" src="/todos" method="${name}">
\`\`\``,
        },
      })),
    },
    {
      name: "behavior",
      values: [
        {
          name: "auto",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`auto\`

Uses the browser's default scrolling behavior.

Scrolling occurs without forcing animation and typically happens instantly,
depending on the user agent.`,
          },
        },
        {
          name: "instant",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`instant\`

Forces scrolling to happen immediately, without animation.

The element jumps directly to the resolved position, bypassing any smooth
scrolling behavior.`,
          },
        },
        {
          name: "smooth",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`smooth\`

Enables animated scrolling to the target position.

The element transitions gradually toward the resolved position instead of
jumping instantly.`,
          },
        },
      ],
    },
    {
      name: "measure",
      values: [
        {
          name: "borderBoxSize",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`borderBoxSize\`

Measures the element's border box size.

Includes:
- content
- padding
- border

Excludes:
- margin

This is the default measurement mode and matches \`ResizeObserverEntry.borderBoxSize\`.`,
          },
        },
        {
          name: "contentBoxSize",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`contentBoxSize\`

Measures the element's content box size.

Includes:
- content

Excludes:
- padding
- border
- margin

Matches \`ResizeObserverEntry.contentBoxSize\`.`,
          },
        },
        {
          name: "devicePixelContentBoxSize",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`devicePixelContentBoxSize\`

Measures the element's content box size in device pixels instead of CSS pixels.

Useful for:
- high-DPI rendering
- canvas synchronization
- pixel-accurate drawing

Matches \`ResizeObserverEntry.devicePixelContentBoxSize\`.`,
          },
        },
        {
          name: "contentRect",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`contentRect\`

Measures the element using the legacy \`contentRect\` rectangle.

Returns dimensions of the content area in CSS pixels.

Matches \`ResizeObserverEntry.contentRect\`.`,
          },
        },
      ],
    },
    {
      name: "scrollPosition",
      values: [
        {
          name: "start",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`start\`

Scrolls to the start of the element.

The scroll position is set to the top (for vertical scrolling) or left
(for horizontal scrolling).`,
          },
        },
        {
          name: "center",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`center\`

Scrolls to the center of the element.

The scroll position is set so that the middle of the scrollable content
is visible.`,
          },
        },
        {
          name: "end",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`end\`

Scrolls to the end of the element.

The scroll position is set to the bottom (for vertical scrolling) or right
(for horizontal scrolling).`,
          },
        },
        {
          name: "<number>",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`<number>\`

A numeric value representing a scroll offset in pixels.

- Positive values scroll forward (down or right).
- Negative values scroll backward (up or left) when used with \`relative\`.

When used without \`relative\`, negative values have undefined behavior.`,
          },
        },
      ],
    },
    {
      name: "requestMode",
      values: [
        {
          name: "parallel",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`parallel\` (default)

Process each response as soon as it is ready.`,
          },
        },
        {
          name: "replace",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`replace\`

Cancel/discard all existing requests before proceeding.`,
          },
        },
        {
          name: "queue",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`queue\`

Process responses in the order the requests were sent.`,
          },
        },
        {
          name: "ignore",
          description: {
            kind: MarkupKind.Markdown,
            value: `**Value**: \`ignore\`

Do nothing if another request is currently active.`,
          },
        },
      ],
    },
  ],
};

export const staticProvider = newHTMLDataProvider("keml", customData);

export const defaultProvider = getDefaultHTMLDataProvider();

export const getId = staticProvider.getId.bind(staticProvider);

export const providedTags = mergeDefinitions(
  staticProvider.provideTags(),
  defaultProvider.provideTags(),
);

export const provideTags = () => providedTags;
