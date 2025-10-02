import { Diagnostic, DiagnosticSeverity, DiagnosticTag, Range } from "vscode";
import { addPartialReferenceDiagnostics } from "./addPartialReferenceDiagnostics";
import {
  getActionUndefinedSeverity,
  getActionUnusedSeverity,
} from "./configure";
import { t } from "./t";

const UNUSED_TPL = t`'${"action"}' ${"kind"} action is declared but its value is never read.`;
const UNDECLARED_TPL = t`Cannot find ${"kind"} action '${"action"}'.`;

/**
 * Adds diagnostics for undefined or unused actions in a document.
 *
 * This function generates two types of diagnostics:
 * 1. **Unused actions** – actions that are declared in the document but never
 *    referenced.
 * 2. **Undefined actions** – actions that are referenced but not declared
 *    anywhere.
 *
 * It uses `addPartialReferenceDiagnostics` internally to generate the
 * diagnostics based on the provided resolvers for definitions and references,
 * the kind of action, and the current severity settings.
 *
 * @param diagnostics - The array to which new `Diagnostic` objects will be
 *                      added.
 * @param cur - The current `ParsedDocument` being analyzed.
 * @param definitionResolver - A function returning a map of action names to
 *                             ranges representing definitions in the document.
 * @param referenceResolver - A function returning a map of action names to
 *                            ranges representing references in the document.
 * @param kind - The kind of action being analyzed; one of `"event"`, `"state"`,
 *               or `"result"`.
 *
 * @example
 * ```ts
 * const diagnostics: Diagnostic[] = [];
 * addReferenceDiagnostics(
 *   diagnostics,
 *   doc,
 *   getEventDefinitions,
 *   getEventReferences,
 *   "event"
 * );
 * ```
 */
export const addReferenceDiagnostics = (
  diagnostics: Diagnostic[],
  cur: ParsedDocument,
  definitionResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  referenceResolver: (cur: ParsedDocument) => Map<string, Range[]>,
  kind: "event" | "state" | "result"
) => {
  const actionUnusedSeverity = getActionUnusedSeverity();
  const actionUndefinedSeverity = getActionUndefinedSeverity();

  if (actionUnusedSeverity != null) {
    addPartialReferenceDiagnostics(
      diagnostics,
      cur,
      definitionResolver,
      referenceResolver,
      kind,
      UNUSED_TPL,
      actionUnusedSeverity,
      actionUnusedSeverity === DiagnosticSeverity.Warning
        ? [DiagnosticTag.Unnecessary]
        : undefined
    );
  }
  if (actionUndefinedSeverity != null) {
    addPartialReferenceDiagnostics(
      diagnostics,
      cur,
      referenceResolver,
      definitionResolver,
      kind,
      UNDECLARED_TPL,
      actionUndefinedSeverity
    );
  }
};
