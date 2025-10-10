import { IAttributeData, MarkupKind } from "vscode-html-languageservice";

/**
 * Predefined Markdown descriptions for well-known custom events.
 *
 * The keys represent custom event names (e.g., `"reveal"`, `"conceal"`),
 * and the values are Markdown-formatted explanations of when those events fire
 * and how they are typically used.
 *
 * If an event name is not listed here, `getEventAttrs` will fall back to a
 * generic "behaves like native event" description.
 */
const CUSTOM_EVENT_DESCRIPTIONS: Record<string, string> = {
  reveal: `* Triggered when an element becomes **visible in the viewport**.
* Fires on initial page load if the element is already visible.
* Fires again whenever the element enters the viewport after scrolling.`,
  conceal: `* Triggered when an element **leaves the viewport** after scrolling.
* Complements \`reveal\`, allowing visibility-based behaviors.`,
  navigate: `* Triggered on **browser history changes** via the History API.
* Useful for responding to in-app navigation without a full page reload.`,
  result: `* Triggered **after a successful request and render of a response**.
* Fires once the new content is fully rendered and all elements with declared
  actions are ready to run.
* Even actions on elements rendered dynamically through this response will fire
  correctly.
* Useful for chaining actions after dynamic updates.`,
};

/**
 * Generates metadata entries for custom `on:event` and `event:event`
 * attributes used in KEML/extended HTML.
 *
 * Each call creates two {@link IAttributeData} objects:
 *
 * - `on:{name}` — Declares a list of actions to run when the event fires.
 *   * Behaves similarly to standard DOM event attributes but uses **named
 *     actions** instead of JavaScript code.
 *   * Supports multiple actions, declared as space-separated names.
 *   * Integrates with companion filters (`event:{name}`).
 *
 * - `event:{name}` — Defines conditions that must be satisfied for the
 *   corresponding `on:{name}` actions to execute.
 *   * Conditions are expressed as a comma-separated list of key/value pairs.
 *   * Provides fine-grained control, such as hotkey filters or modifier checks.
 *
 * The descriptions are provided in Markdown format and rendered in VS Code’s
 * IntelliSense hover/tooltips.
 *
 * @param name - The base event name (e.g., `"click"`, `"keydown"`, `"reveal"`).
 *
 * @returns An array of two {@link IAttributeData} entries:
 *          one for `on:{name}` and one for `event:{name}`.
 */
export const getEventAttrs = (name: string): IAttributeData[] => [
  {
    name: `on:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`on:${name}\`

${
  CUSTOM_EVENT_DESCRIPTIONS[name] ??
  `* Behaves like the native \`${name}\` event.`
}
* Declares a **list of named actions** to run when the event fires.
  * Actions are **names**, not arbitrary JavaScript code.
  * Names can be **reused** across your KEML project.
* Supports **space-separated action names**.
  * All listed actions run in order when triggered.
* May be gated by a companion **\`event:${name}\` filter** — if conditions don't
  match, no actions fire.

💡 Actions declared here are the **source**; other attributes like \`on\` and
\`reset\` can **reference them**.

Example:
\`\`\`html
<button on:click="save highlight" event:click="ctrlKey">
  Save with Ctrl+Click
</button>
\`\`\`
→ Runs \`save\` and \`highlight\` actions only if **Ctrl** is pressed when
  clicking.`,
    },
  },
  {
    name: `event:${name}`,
    description: {
      kind: MarkupKind.Markdown,
      value: `**Attribute**: \`event:${name}\`

* Defines **conditions** that must be satisfied for \`on:${name}\` actions to
  fire.
* Accepts a **comma-separated list** of \`key=value\` pairs.

Condition rules:
1. \`key=value\` → matches when \`String(event[key]) === String(value)\`
   * Whitespace around \`=\` or the value is ignored
     → \`key=value\`, \`key = value\`, \`key=   value\` are equivalent
2. \`key\` (no \`=\`) → matches when \`!!event[key]\` is truthy
3. \`key=\` (empty value) → matches when \`String(event[key]) === ""\`

* If **all pairs match**, the actions fire.
* If **any pair fails**, the actions are skipped.

💡 Useful for hotkeys and modifiers. Example:
\`event:keydown="ctrlKey, key=a"\`
→ fires only when **Ctrl+A** is pressed.`,
    },
  },
];

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getEventAttrs", () => {
    it("returns 2 elements", () => {
      expect(getEventAttrs("foo").length).toBe(2);
    });
  });
}
/* v8 ignore stop */
