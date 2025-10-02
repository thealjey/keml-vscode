/**
 * Retrieves the mapping of state action definitions from a
 * {@link ParsedDocument}.
 *
 * `state_definitions` maps each state action name to an array of {@link Range}
 * objects representing where that action is **defined** within the document.
 *
 * This function is a convenience helper for code that needs to access state
 * definitions without directly touching the `ParsedDocument` structure.
 *
 * @param cur - A {@link ParsedDocument} object containing `state_definitions`.
 *
 * @returns The `state_definitions` map: `Map<string, Range[]>`.
 *
 * @example
 * ```ts
 * const definitions = getStateDefinitions(parsedDoc);
 *
 * for (const [state, ranges] of definitions) {
 *   console.log(state, ranges.length);
 * }
 * ```
 */
export const getStateDefinitions = ({ state_definitions }: ParsedDocument) =>
  state_definitions;
