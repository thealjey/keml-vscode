import { Diagnostic, DiagnosticSeverity, DiagnosticTag, Range } from "vscode";
import { t } from "./t";

const DEP_TPL = t`'${"name"}' without ${"article"} '${"depends"}' (or 'x-${"depends"}') does nothing.`;

/**
 * Adds a warning diagnostic if a required dependent attribute is missing.
 *
 * Checks whether the `depends` attribute (or its `x-` prefixed variant) exists
 * in the given `attributes` object. If missing, a `Diagnostic` is created
 * with a warning severity and added to the `diagnostics` array.
 *
 * @param diagnostics - Array of {@link Diagnostic} objects to append to.
 * @param attributes - Record mapping attribute names to their values.
 * @param range - The {@link Range} in the document where the warning applies.
 * @param name - The name of the current attribute being checked.
 * @param depends - The dependent attribute that is required.
 * @param article - Optional article string to use in the message
 *                  (default: `"a"`).
 *
 * @example
 * ```ts
 * const diagnostics: Diagnostic[] = [];
 * const attrs = { foo: "bar" };
 * const range = new Range(0, 0, 0, 3);
 * addDependsDiagnostic(diagnostics, attrs, range, "foo", "bar");
 * // Adds a warning diagnostic because 'bar' is missing
 * ```
 */
export const addDependsDiagnostic = (
  diagnostics: Diagnostic[],
  attributes: Record<string, string | null>,
  range: Range,
  name: string,
  depends: string,
  article = "a"
) => {
  if (depends in attributes || `x-${depends}` in attributes) {
    return;
  }
  const diagnostic = new Diagnostic(
    range,
    DEP_TPL({ name, article, depends }),
    DiagnosticSeverity.Warning
  );
  diagnostic.source = "KEML";
  diagnostic.tags = [DiagnosticTag.Unnecessary];
  diagnostics.push(diagnostic);
};
