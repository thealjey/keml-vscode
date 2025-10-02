import { isOnDependent } from "./isOnDependent";

const onDependentTags = new Map([
  ["href", ["base", "link", "a"]],
  ["action", ["form"]],
  [
    "src",
    [
      "img",
      "iframe",
      "embed",
      "video",
      "audio",
      "source",
      "track",
      "input",
      "script",
    ],
  ],
  ["method", ["form"]],
  [
    "name",
    [
      "meta",
      "iframe",
      "object",
      "param",
      "map",
      "form",
      "input",
      "button",
      "select",
      "textarea",
      "output",
      "fieldset",
      "slot",
    ],
  ],
  [
    "value",
    ["li", "param", "input", "button", "option", "progress", "meter", "data"],
  ],
]);

/**
 * Determines whether a given attribute name is **on-dependent** for a specific
 * HTML tag.
 *
 * The function returns `true` if:
 * 1. The attribute is considered on-dependent globally
 *    (via `isOnDependent`), or
 * 2. The attribute has a tag-specific restriction and the given tag is **not**
 *    in the allowed list.
 *
 * It also supports `x-` prefixed attribute names by stripping the prefix and
 * checking against the same tag restrictions.
 *
 * @param tag - The HTML tag name to check (e.g., `"div"`, `"input"`).
 * @param name - The attribute name to test (e.g., `"href"`, `"x-throttle"`).
 * @returns `true` if the attribute is on-dependent for the given tag, otherwise
 *          `false`.
 *
 * @example
 * ```ts
 * isTagOnDependent("div", "debounce");       // true
 * isTagOnDependent("form", "action");        // false
 * isTagOnDependent("iframe", "x-src");       // true
 * isTagOnDependent("a", "href");             // false
 * ```
 */
export const isTagOnDependent = (tag: string, name: string) => {
  if (isOnDependent(name)) {
    return true;
  }

  let tags = onDependentTags.get(name);
  if (tags) {
    return !tags.includes(tag);
  }

  if (name.startsWith("x-") && (tags = onDependentTags.get(name.slice(2)))) {
    return !tags.includes(tag);
  }

  return false;
};
