import { Diagnostic, DiagnosticSeverity, DiagnosticTag, Range } from "vscode";
import { docs } from "./data.mts";

/**
 * Adds diagnostics for items present in one set but missing in a corresponding
 * reference set.
 *
 * @param diagnostics - Array to which new diagnostics will be added.
 * @param cur - Current document being analyzed.
 * @param left - Function returning a map of items from the current document.
 * @param right - Function returning a map of reference items from another
 *                document.
 * @param kind - Kind of diagnostic to apply.
 * @param tpl - Template function to generate diagnostic messages.
 * @param severity - Severity level of the diagnostics.
 * @param tags - Optional tags associated with the diagnostics.
 */
export const addPartialReferenceDiagnostics = <T extends string>(
  diagnostics: Diagnostic[],
  cur: Document,
  left: (cur: Document) => Map<string, Range[]>,
  right: (cur: Document) => Map<string, Range[]>,
  kind: T,
  tpl: (scope: { kind: T; action: string }) => string,
  severity: DiagnosticSeverity,
  tags?: DiagnosticTag[]
) => {
  let found, ref, range, diagnostic;

  for (const [action, ranges] of left(cur)) {
    found = false;
    for (ref of extern.docs.values()) {
      if (right(ref).has(action)) {
        found = true;
        break;
      }
    }
    if (!found) {
      for (range of ranges) {
        diagnostic = new extern.Diagnostic(
          range,
          tpl({ kind, action }),
          severity
        );
        diagnostic.source = "KEML";
        if (tags) {
          diagnostic.tags = tags;
        }
        diagnostics.push(diagnostic);
      }
    }
  }
};

let extern = { Diagnostic, docs };

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

  describe("addPartialReferenceDiagnostics", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("adds a diagnostic when no matching action found in right refs", () => {
      const diagnostics: any[] = [];
      const mockRange = { id: 1 } as any;
      const kind = "K" as const;
      const tpl = fn().mockImplementation(
        ({ kind, action }) => `${kind}:${action}`
      );
      const severity = 2 as any;

      extern.docs = { values: () => [{}, {}][Symbol.iterator]() } as any;
      extern.Diagnostic = class {
        constructor(
          public range: any,
          public message: any,
          public severity: any
        ) {}
      };

      const left = fn().mockReturnValue(
        new Map([["missingAction", [mockRange]]])
      );
      const right = fn().mockReturnValue(new Map());

      addPartialReferenceDiagnostics(
        diagnostics,
        {} as any,
        left,
        right,
        kind,
        tpl,
        severity
      );
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]).toMatchObject({
        range: mockRange,
        message: "K:missingAction",
        severity,
        source: "KEML",
      });
    });

    it("does not add diagnostics when action is found in right refs", () => {
      const diagnostics: any[] = [];
      const kind = "K" as const;
      const tpl = fn();
      const severity = 1 as any;

      extern.docs = {
        values: () => [{}, {}][Symbol.iterator](),
      } as any;
      extern.Diagnostic = class {
        constructor(
          public range: any,
          public message: any,
          public severity: any
        ) {}
      };

      const left = fn().mockReturnValue(
        new Map([["foundAction", [{} as any]]])
      );
      const right = fn().mockImplementation(
        () => new Map([["foundAction", [{} as any]]])
      );

      addPartialReferenceDiagnostics(
        diagnostics,
        {} as any,
        left,
        right,
        kind,
        tpl,
        severity
      );
      expect(diagnostics).toHaveLength(0);
    });

    it("includes tags when provided", () => {
      const diagnostics: any[] = [];
      const mockRange = { id: 2 } as any;
      const tags = ["tag1", "tag2"] as any;
      const tpl = fn().mockReturnValue("msg");
      const severity = 3 as any;

      extern.docs = { values: () => [][Symbol.iterator]() } as any;
      extern.Diagnostic = class {
        constructor(
          public range: any,
          public message: any,
          public severity: any
        ) {}
      };

      const left = fn().mockReturnValue(new Map([["missing", [mockRange]]]));
      const right = fn().mockReturnValue(new Map());

      addPartialReferenceDiagnostics(
        diagnostics,
        {} as any,
        left,
        right,
        "K" as any,
        tpl,
        severity,
        tags
      );
      expect(diagnostics[0]).toMatchObject({
        tags,
        source: "KEML",
      });
    });
  });
}
/* v8 ignore stop */
