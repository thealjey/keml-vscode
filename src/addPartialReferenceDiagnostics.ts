import { Diagnostic, DiagnosticSeverity, DiagnosticTag, Range } from "vscode";
import { docs } from "./configure";

/**
 * Adds diagnostics for actions that are defined in one set but missing in
 * another.
 *
 * Iterates over all actions from the `left` map of a given document and checks
 * if each action exists in the `right` map across all documents. If an action
 * is not found, a `Diagnostic` is created for each of its ranges using the
 * provided template, severity, and optional tags.
 *
 * @template T - A string literal type representing the kind of diagnostic.
 *
 * @param diagnostics - The array to which new `Diagnostic` objects will be
 *                      added.
 * @param cur - The current `ParsedDocument` from which to check left-side
 *              actions.
 * @param left - A function that returns a map of action names to ranges for the
 *               left-hand side.
 * @param right - A function that returns a map of action names to ranges for
 *                the right-hand side.
 * @param kind - The kind of diagnostic being generated, passed to the template.
 * @param tpl - A template function that generates the diagnostic message string
 *              based on the kind and action name.
 * @param severity - The severity level of the diagnostic.
 * @param tags - Optional array of `DiagnosticTag`s to apply to each diagnostic.
 *
 * @example
 * ```ts
 * const diagnostics: Diagnostic[] = [];
 * addPartialReferenceDiagnostics(
 *   diagnostics,
 *   doc,
 *   getStateDefinitions,
 *   getStateReferences,
 *   "state",
 *   t`${"kind"} '${"action"}' is referenced but not defined.`,
 *   DiagnosticSeverity.Warning
 * );
 * ```
 */
export const addPartialReferenceDiagnostics = <T extends string>(
  diagnostics: Diagnostic[],
  cur: ParsedDocument,
  left: (cur: ParsedDocument) => Map<string, Range[]>,
  right: (cur: ParsedDocument) => Map<string, Range[]>,
  kind: T,
  tpl: (scope: { kind: T; action: string }) => string,
  severity: DiagnosticSeverity,
  tags?: DiagnosticTag[]
) => {
  let found, ref, range, diagnostic;

  for (const [action, ranges] of left(cur)) {
    found = false;
    for (ref of docs.values()) {
      if (right(ref).has(action)) {
        found = true;
        break;
      }
    }
    if (!found) {
      for (range of ranges) {
        diagnostic = new Diagnostic(range, tpl({ kind, action }), severity);
        diagnostic.source = "KEML";
        if (tags) {
          diagnostic.tags = tags;
        }
        diagnostics.push(diagnostic);
      }
    }
  }
};
