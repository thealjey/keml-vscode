import { Diagnostic, DiagnosticSeverity, DiagnosticTag, Range } from "vscode";
import { addPartialReferenceDiagnostics } from "./addPartialReferenceDiagnostics.mts";
import {
  getActionUndefinedSeverity,
  getActionUnusedSeverity,
} from "./data.mts";
import { t } from "./t.mts";

const UNUSED_TPL = t`'${"action"}' ${"kind"} action is declared but its value is never read.`;
const UNDECLARED_TPL = t`Cannot find ${"kind"} action '${"action"}'.`;

/**
 * Adds diagnostics for unused or undefined references in a document.
 *
 * @param diagnostics - Array to which new diagnostics will be added.
 * @param cur - Current document being analyzed.
 * @param definitionResolver - Function that returns a map of definitions for
 *                             the document.
 * @param referenceResolver - Function that returns a map of references for the
 *                            document.
 * @param kind - Kind of action being analyzed ("event", "state", or "result").
 */
export const addReferenceDiagnostics = (
  diagnostics: Diagnostic[],
  cur: Document,
  definitionResolver: (cur: Document) => Map<string, Range[]>,
  referenceResolver: (cur: Document) => Map<string, Range[]>,
  kind: "event" | "state" | "result"
) => {
  const actionUnusedSeverity = extern.getActionUnusedSeverity();
  const actionUndefinedSeverity = extern.getActionUndefinedSeverity();

  if (actionUnusedSeverity != null) {
    extern.addPartialReferenceDiagnostics(
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
    extern.addPartialReferenceDiagnostics(
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

let extern = {
  addPartialReferenceDiagnostics,
  getActionUndefinedSeverity,
  getActionUnusedSeverity,
};

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("addReferenceDiagnostics", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("does nothing when both severities are null", () => {
      extern.getActionUnusedSeverity = fn().mockReturnValue(null);
      extern.getActionUndefinedSeverity = fn().mockReturnValue(null);
      extern.addPartialReferenceDiagnostics = fn();

      addReferenceDiagnostics([], {} as any, fn(), fn(), "event");

      expect(extern.addPartialReferenceDiagnostics).not.toHaveBeenCalled();
      expect(extern.getActionUnusedSeverity).toHaveBeenCalled();
      expect(extern.getActionUndefinedSeverity).toHaveBeenCalled();
    });

    it("calls addPartialReferenceDiagnostics with Warning unusedSeverity", () => {
      const diagnostics: any[] = [];
      const cur = {} as any;
      const defResolver = fn();
      const refResolver = fn();

      extern.getActionUnusedSeverity = fn().mockReturnValue(
        DiagnosticSeverity.Warning
      );
      extern.getActionUndefinedSeverity = fn().mockReturnValue(
        DiagnosticSeverity.Error
      );
      const mockAddDiagnostics = (extern.addPartialReferenceDiagnostics = fn());

      addReferenceDiagnostics(
        diagnostics,
        cur,
        defResolver,
        refResolver,
        "state"
      );

      expect(mockAddDiagnostics).toHaveBeenCalledTimes(2);
      expect(mockAddDiagnostics.mock.calls).toMatchObject([
        [
          diagnostics,
          cur,
          defResolver,
          refResolver,
          "state",
          expect.any(Function),
          DiagnosticSeverity.Warning,
          [DiagnosticTag.Unnecessary],
        ],
        [
          diagnostics,
          cur,
          refResolver,
          defResolver,
          "state",
          expect.any(Function),
          DiagnosticSeverity.Error,
        ],
      ]);
    });

    it("calls addPartialReferenceDiagnostics with non-Warning unusedSeverity", () => {
      const diagnostics: any[] = [];
      const cur = {} as any;
      const defResolver = fn();
      const refResolver = fn();

      extern.getActionUnusedSeverity = fn().mockReturnValue(
        DiagnosticSeverity.Error
      );
      extern.getActionUndefinedSeverity = fn().mockReturnValue(
        DiagnosticSeverity.Error
      );
      const mockAddDiagnostics = (extern.addPartialReferenceDiagnostics = fn());

      addReferenceDiagnostics(
        diagnostics,
        cur,
        defResolver,
        refResolver,
        "state"
      );

      expect(mockAddDiagnostics).toHaveBeenCalledTimes(2);
      expect(mockAddDiagnostics.mock.calls).toMatchObject([
        [
          diagnostics,
          cur,
          defResolver,
          refResolver,
          "state",
          expect.any(Function),
          DiagnosticSeverity.Error,
          undefined,
        ],
        [
          diagnostics,
          cur,
          refResolver,
          defResolver,
          "state",
          expect.any(Function),
          DiagnosticSeverity.Error,
        ],
      ]);
    });
  });
}
/* v8 ignore stop */
