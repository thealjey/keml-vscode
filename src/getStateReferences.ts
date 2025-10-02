/**
 * Retrieves the mapping of state action references from a
 * {@link ParsedDocument}.
 *
 * `state_references` maps each state action name to an array of {@link Range}
 * objects representing where that action is **referenced** within the document
 * (i.e., used in attributes like `if="foo"`).
 *
 * This function is a convenience helper for code that needs to analyze or
 * process state references without directly accessing the `ParsedDocument`
 * structure.
 *
 * @param cur - A {@link ParsedDocument} object containing `state_references`.
 *
 * @returns The `state_references` map: `Map<string, Range[]>`.
 *
 * @example
 * ```ts
 * const references = getStateReferences(parsedDoc);
 *
 * for (const [state, ranges] of references) {
 *   console.log(state, ranges.length);
 * }
 * ```
 */
export const getStateReferences = ({ state_references }: ParsedDocument) =>
  state_references;
