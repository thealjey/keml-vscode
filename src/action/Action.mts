import { Diagnostic, DiagnosticSeverity, DiagnosticTag } from "vscode";
import type { IAttributeData } from "vscode-html-languageservice";
import { isInvalidToken } from "../document/isInvalidToken.mts";
import { INVALID_PATTERN } from "../document/parseTokens.mts";
import { t } from "../util/t.mts";

export type Options =
  | [RegExp, RegExp, string, string[]]
  | [RegExp, RegExp, string, string[], any];

export type Channel = [RegExp, RegExp[]] | [RegExp, RegExp[], boolean];

const INPUT_INVALID = `Action input channels can only hold one value and are used verbatim.
Make sure the action name does not contain spaces.`;

const DEPENDENCY_VIOLATION = t`${"name"} is inactive.
Needs: ${"depends"} (or a ${"prefixes"} prefixed alternative).`;

const OPTION_VIOLATION = t`Invalid ${"label|1"}.
Expected: ${"options"}.
${"message|1"}.`;

const OPTION_IGNORE = "The value will be ignored";

const OPTION_FALLBACK = t`Falling back to ${"fallback"}`;

/**
 * Represents a rule-based action that defines attribute behavior, validation
 * rules, and diagnostics for a document model.
 */
export class Action {
  name: string = "action";
  prefix: string[] = [];
  prefixes: string[] = [];
  otherPrefix: string[] = [];
  combinedPrefixes: string[] = [];
  output: Channel[] = [];
  input: Channel[] = [];
  other: Channel[] = [];
  options: Options[] = [];
  tags: [string, RegExp][] = [];
  baseName!: (name: string) => string;
  combinedBaseName!: (name: string) => string;

  /**
   * Provides additional attributes contributed by this action.
   */
  provideAttributes(_attr: IAttributeData): IAttributeData[] {
    return [];
  }

  /**
   * Produces diagnostics for an attribute based on action rules,
   * including validation, dependency checks, and option constraints.
   */
  provideDiagnostics({
    name,
    value,
    range,
    fullRange,
    node,
  }: Attr): Diagnostic[] {
    const result: Diagnostic[] = [];
    let diagnostic: Diagnostic, dependency: [RegExp, RegExp] | undefined;

    if (this.isInput(name)) {
      if (!value) {
        diagnostic = new Diagnostic(
          fullRange,
          "No action specified.",
          DiagnosticSeverity.Warning,
        );
        diagnostic.source = "KEML";
        diagnostic.tags = [DiagnosticTag.Unnecessary];
        result.push(diagnostic);
      } else if (isInvalidToken(value) && range) {
        diagnostic = new Diagnostic(
          range,
          INPUT_INVALID,
          DiagnosticSeverity.Error,
        );
        diagnostic.source = "KEML";
        result.push(diagnostic);
      }
    }

    if ((dependency = this.rejectAttribute(node, name, true))) {
      const trimmed = this.baseName(name);
      const base = this.combinedBaseName(name);
      let tagOverride;

      for (const [attrName, pattern] of this.tags) {
        node.tag &&
          attrName === base &&
          pattern.test(node.tag) &&
          (tagOverride = true);
      }

      if (!tagOverride) {
        let [{ source }, child] = dependency;
        let depends: string[];

        if (!source.endsWith("$")) {
          depends = [source.slice(1) + trimmed.replace(child, "")];
        } else {
          source = source.slice(1, -1);
          if (!source.startsWith("(")) {
            depends = [source];
          } else {
            depends = source.slice(1, -1).split("|");
          }
        }
        diagnostic = new Diagnostic(
          fullRange,
          DEPENDENCY_VIOLATION({
            name: trimmed,
            depends,
            prefixes: this.combinedPrefixes,
          }),
          DiagnosticSeverity.Warning,
        );
        diagnostic.source = "KEML";
        diagnostic.tags = [DiagnosticTag.Unnecessary];
        result.push(diagnostic);
      }
    }

    for (const [pattern, validity, label, options, fallback] of this.options) {
      if (
        pattern.test(name) &&
        !INVALID_PATTERN.test(value) &&
        !validity.test(value)
      ) {
        diagnostic = new Diagnostic(
          range ?? fullRange,
          OPTION_VIOLATION({
            label,
            options,
            message:
              fallback == null ? OPTION_IGNORE : OPTION_FALLBACK({ fallback }),
          }),
          range ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning,
        );
        diagnostic.source = "KEML";
        result.push(diagnostic);
      }
    }

    return result;
  }

  /**
   * Determines whether a parent-child relationship between attributes is valid.
   */
  testParent(_parent: string, _child: string) {
    return false;
  }

  /**
   * Determines whether an attribute is rejected in the current node context.
   *
   * May return dependency information if rejection is due to missing
   * requirements.
   */
  rejectAttribute(
    node: Node,
    name: string,
    suppress?: boolean,
  ): [RegExp, RegExp] | undefined {
    const attrNames = Array.from(node.attributes.keys(), this.combinedBaseName);
    name = this.combinedBaseName(name);

    for (const channel of [this.output, this.input, this.other]) {
      for (const [parent, children, keep] of channel) {
        for (const child of children) {
          if (child.test(name)) {
            for (const attrName of attrNames) {
              if (parent.test(attrName) || this.testParent(attrName, name)) {
                return;
              }
            }
            return !keep || suppress ? [parent, child] : undefined;
          }
        }
      }
    }
  }

  /**
   * Checks whether a name matches any pattern in a given channel definition.
   */
  checkName(name: string, patterns: Channel[]) {
    return patterns.some(([pattern]) => pattern.test(name));
  }

  /**
   * Determines whether a name is considered an output attribute for this
   * action.
   */
  isOutput(name: string) {
    return this.checkName(this.baseName(name), this.output);
  }

  /**
   * Determines whether a name is considered an input attribute for this action.
   */
  isInput(name: string) {
    return this.checkName(this.baseName(name), this.input);
  }
}
