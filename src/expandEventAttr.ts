import { IAttributeData } from "vscode-html-languageservice";
import { getEventAttrs } from "./getEventAttrs";

/**
 * Expands event-type attributes into a full set of related attributes.
 *
 * If the input attribute is a **DOM-style event** (starts with `"on"` but
 * not followed by a colon), this function returns an array containing:
 * 1. The original attribute (`onclick`)
 * 2. The corresponding `on:` prefixed attribute (`on:click`)
 * 3. The corresponding `event:` prefixed attribute (`event:click`)
 *
 * Non-event attributes are returned unchanged.
 *
 * @param attrData - The {@link IAttributeData} representing the attribute to
 *                   expand.
 *
 * @returns Either:
 * - An array of {@link IAttributeData} containing the original and expanded
 *   event attributes, or
 * - The original {@link IAttributeData} if it is not an event-type attribute.
 *
 * @example
 * ```ts
 * expandEventAttr({ name: "onclick", ... });
 * // Returns: [
 * //   { name: "onclick", ... },
 * //   { name: "on:click", ... },
 * //   { name: "event:click", ... }
 * // ]
 *
 * expandEventAttr({ name: "id", ... });
 * // Returns: { name: "id", ... }
 * ```
 */
export const expandEventAttr = (attrData: IAttributeData) => {
  const { name } = attrData;

  return name.length > 2 &&
    name.charCodeAt(0) === 111 &&
    name.charCodeAt(1) === 110 &&
    name.charCodeAt(2) !== 58
    ? getEventAttrs(name.slice(2)).concat(attrData)
    : attrData;
};
