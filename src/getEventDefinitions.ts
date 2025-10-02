/**
 * Retrieves the mapping of event action definitions from a
 * {@link ParsedDocument}.
 *
 * `event_definitions` maps each event action name to an array of {@link Range}
 * objects representing where that action is **defined** within the document.
 *
 * This function is primarily a convenience helper for code that needs to access
 * event definitions without directly touching the `ParsedDocument` structure.
 *
 * @param cur - A {@link ParsedDocument} object containing `event_definitions`.
 *
 * @returns The `event_definitions` map: `Map<string, Range[]>`.
 *
 * @example
 * ```ts
 * const definitions = getEventDefinitions(parsedDoc);
 *
 * for (const [action, ranges] of definitions) {
 *   console.log(action, ranges.length);
 * }
 * ```
 */
export const getEventDefinitions = ({ event_definitions }: ParsedDocument) =>
  event_definitions;
