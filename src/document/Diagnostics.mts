import { Diagnostic, DiagnosticSeverity } from "vscode";
import { actions, combinedBaseName } from "../action/actions.mts";
import { config } from "./data.mts";

/**
 * Collects and aggregates diagnostics for a document.
 *
 * Gathers diagnostics from registered actions and applies additional
 * rule-based warnings for specific attributes.
 */
export class Diagnostics {
  data: Diagnostic[] = [];
  hasLog = false;

  /**
   * Adds diagnostics for a parsed attribute based on registered rules.
   *
   * May also add additional warnings for special-case attributes.
   */
  associate(attr: Attr) {
    for (const action of actions) {
      this.data.push(...action.provideDiagnostics(attr));
    }

    if (combinedBaseName(attr.name) === "log") {
      this.hasLog = true;
      if (config.WARN_LOG) {
        const diagnostic = new Diagnostic(
          attr.fullRange,
          `Debug attribute \`log\` is enabled. Remove before production or disable this warning with \`keml.warnOnLogAttribute\`.`,
          DiagnosticSeverity.Warning,
        );
        diagnostic.source = "KEML";
        this.data.push(diagnostic);
      }
    }
  }
}
