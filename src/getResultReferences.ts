/**
 * Retrieves the mapping of result action references from a
 * {@link ParsedDocument}.
 *
 * `result_references` maps each result action name to an array of
 * {@link Range} objects representing where that action is **referenced**
 * within the document (i.e., used in attributes like `render="foo"`).
 *
 * This function is a convenience helper for code that needs to analyze or
 * process result references without directly accessing the `ParsedDocument`
 * structure.
 *
 * @param cur - A {@link ParsedDocument} object containing `result_references`.
 *
 * @returns The `result_references` map: `Map<string, Range[]>`.
 *
 * @example
 * ```ts
 * const references = getResultReferences(parsedDoc);
 *
 * for (const [action, ranges] of references) {
 *   console.log(action, ranges.length);
 * }
 * ```
 */
export const getResultReferences = ({ result_references }: ParsedDocument) =>
  result_references;
