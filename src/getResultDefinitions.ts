/**
 * Retrieves the mapping of result action definitions from a
 * {@link ParsedDocument}.
 *
 * `result_definitions` maps each result action name to an array of
 * {@link Range} objects representing where that action is **defined**
 * within the document.
 *
 * This function is a convenience helper for code that needs to access result
 * definitions without directly touching the `ParsedDocument` structure.
 *
 * @param cur - A {@link ParsedDocument} object containing `result_definitions`.
 *
 * @returns The `result_definitions` map: `Map<string, Range[]>`.
 *
 * @example
 * ```ts
 * const definitions = getResultDefinitions(parsedDoc);
 *
 * for (const [action, ranges] of definitions) {
 *   console.log(action, ranges.length);
 * }
 * ```
 */
export const getResultDefinitions = ({ result_definitions }: ParsedDocument) =>
  result_definitions;
