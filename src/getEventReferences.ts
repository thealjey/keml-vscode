/**
 * Retrieves the mapping of event action references from a
 * {@link ParsedDocument}.
 *
 * `event_references` maps each event action name to an array of {@link Range}
 * objects representing where that action is **referenced** within the document
 * (i.e., used in attributes like `on="foo"`).
 *
 * This function is a convenience helper for code that needs to analyze or
 * process event references without directly accessing the `ParsedDocument`
 * structure.
 *
 * @param cur - A {@link ParsedDocument} object containing `event_references`.
 *
 * @returns The `event_references` map: `Map<string, Range[]>`.
 *
 * @example
 * ```ts
 * const references = getEventReferences(parsedDoc);
 *
 * for (const [action, ranges] of references) {
 *   console.log(action, ranges.length);
 * }
 * ```
 */
export const getEventReferences = ({ event_references }: ParsedDocument) =>
  event_references;
