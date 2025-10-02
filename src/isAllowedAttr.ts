import { IAttributeData } from "vscode-html-languageservice";
import { getAttributes } from "./configure";
import { isEventFilter } from "./isEventFilter";
import { isOnDependent } from "./isOnDependent";
import { isPosition } from "./isPosition";

/**
 * Determines whether a given attribute is allowed based on the current
 * set of configured attributes and its type.
 *
 * The rules for allowance are:
 * - **Event filter attributes** (`on:*`) are allowed if a corresponding
 *   `on` or `x-on` attribute exists in the configuration.
 * - **Position attributes** (`position` or `x-position`) are allowed only
 *   if `render` or `x-render` is present.
 * - **On-dependent attributes** (e.g., `debounce`, `throttle`, etc.) are
 *   allowed only if `on` or `x-on` exists.
 * - All other attributes are allowed by default.
 *
 * @param attrData - The attribute data object from the HTML language service.
 *
 * @returns `true` if the attribute is allowed, `false` otherwise.
 *
 * @example
 * ```ts
 * const attr = { name: "debounce" };
 * console.log(isAllowedAttr(attr)); // true or false depending on configuration
 * ```
 */
export const isAllowedAttr = (attrData: IAttributeData) => {
  const { name } = attrData;
  const attributes = getAttributes();

  return isEventFilter(name)
    ? `on${name.slice(name.indexOf(":"))}` in attributes ||
        `x-on${name.slice(name.indexOf(":"))}` in attributes
    : isPosition(name)
    ? "render" in attributes || "x-render" in attributes
    : isOnDependent(name)
    ? "on" in attributes || "x-on" in attributes
    : true;
};
