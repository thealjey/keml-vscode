import { type IAttributeData, MarkupKind } from "vscode-html-languageservice";
import { getEventModifier } from "./getEventModifier.mts";

export const CUSTOM_EVENT_DESCRIPTIONS: Record<string, string> = {
  reveal: `* Triggered when an element becomes **visible in the viewport**.
* Fires on initial page load if the element is already visible.
* Fires again whenever the element enters the viewport after scrolling.`,
  conceal: `* Triggered when an element **leaves the viewport** after scrolling.
* Complements \`reveal\`, allowing visibility-based behaviors.`,
  navigate: `* Triggered on **browser history changes** via the History API.
* Useful for responding to in-app navigation without a full page reload.`,
  result: `* Triggered **after receiving a response with a successful status code**.
* Fires once the new content is fully rendered and all elements with declared
  actions are ready to run.
* Even actions on elements rendered dynamically through this response will fire
  correctly.
* Useful for chaining actions after dynamic updates.`,
  failure: `* Triggered **after receiving a response with an unsuccessful status code**.
* Fires once the new content is fully rendered and all elements with declared
  actions are ready to run.
* Even actions on elements rendered dynamically through this response will fire
  correctly.
* Useful for chaining actions after dynamic updates.`,
  discover: `* Triggered **when the element is first discovered**.
* Will be re-emitted if the \`on:discover\` attribute is removed and then added back again.`,
};

/**
 * Creates event-driven attribute metadata for a synthetic event system,
 * including a companion condition modifier attribute.
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
* Declares a **list of named actions** to output when the event fires.
* Supports **space-separated action names**.
* May be gated by a companion **\`event:${name}\` modifier** — if conditions
  don't match, no actions are produced.

Example:
\`\`\`html
<button on:click="save highlight" event:click="ctrlKey">
  Save with Ctrl+Click
</button>
\`\`\`
→ Outputs \`save\` and \`highlight\` actions only if **Ctrl** is pressed when
  clicking.`,
    },
  },
  getEventModifier(name),
];
