import { Diagnostic, Range, TextDocument } from "vscode";
import {
  HTMLDocument,
  TextDocument as LSTextDocument,
} from "vscode-html-languageservice";

declare global {
  /**
   * Represents a parsed HTML document within a VS Code extension context.
   *
   * A `ParsedDocument` wraps a standard VS Code {@link TextDocument} and
   * augments it with data structures produced by the VS Code HTML language
   * service. It also collects references and definitions of "actions" (custom
   * attributes such as `on:click`, `if`, or `result`) as well as any
   * diagnostics identified during parsing.
   *
   * This interface is designed to provide a unified representation of an HTML
   * document for use in analysis, validation, or language features (e.g.,
   * diagnostics, code navigation, autocompletion).
   */
  interface ParsedDocument {
    /**
     * The original {@link TextDocument} object as provided by the VS Code API.
     *
     * This is the authoritative source of the document text and metadata, and
     * can be used for retrieving document contents, positions, and ranges.
     */
    doc: TextDocument;

    /**
     * A {@link TextDocument} compatible with the VS Code HTML language service.
     *
     * Unlike {@link ParsedDocument.doc}, this version is tailored for use with
     * the `vscode-html-languageservice` API, which requires its own document
     * abstraction for parsing and analysis.
     */
    textDoc: LSTextDocument;

    /**
     * The parsed HTML tree representation of the document.
     *
     * This is produced by the HTML language service and provides structured
     * access to elements, attributes, and text nodes.
     */
    htmlDoc: HTMLDocument;

    /**
     * Maps event action names (e.g., `"foo"`, `"bar"`) to the ranges in which
     * they are defined in the document.
     *
     * Event actions are typically defined in attributes prefixed with `on:`,
     * such as `on:click`. Multiple actions may be space-separated.
     *
     * @example
     * ```html
     * <button on:click="foo bar"></button>
     * ```
     * This produces:
     * - `"foo"` → [Range]
     * - `"bar"` → [Range]
     */
    event_definitions: Map<string, Range[]>;

    /**
     * Maps event action names to the ranges where they are referenced in the
     * document.
     *
     * Event references are typically found in `on` attributes, where the value
     * names a previously defined event action.
     *
     * @example
     * ```html
     * <div on="foo"></div>
     * <div on="bar"></div>
     * ```
     * This produces:
     * - `"foo"` → [Range]
     * - `"bar"` → [Range]
     */
    event_references: Map<string, Range[]>;

    /**
     * Maps state action names to the ranges where they are defined in the
     * document.
     *
     * State actions are typically introduced in conditional attributes prefixed
     * with `if:`.
     *
     * @example
     * ```html
     * <input if:invalid="foo bar">
     * ```
     * This produces:
     * - `"foo"` → [Range]
     * - `"bar"` → [Range]
     */
    state_definitions: Map<string, Range[]>;

    /**
     * Maps state action names to the ranges where they are referenced in the
     * document.
     *
     * State references usually appear in plain `if` attributes, referencing a
     * state action previously defined.
     *
     * @example
     * ```html
     * <div if="foo"></div>
     * <div if="bar"></div>
     * ```
     * This produces:
     * - `"foo"` → [Range]
     * - `"bar"` → [Range]
     */
    state_references: Map<string, Range[]>;

    /**
     * Maps result action names to the ranges where they are defined in the
     * document.
     *
     * Result actions are typically introduced in attributes such as `result`.
     *
     * @example
     * ```html
     * <form result="foo bar"></form>
     * ```
     * This produces:
     * - `"foo"` → [Range]
     * - `"bar"` → [Range]
     */
    result_definitions: Map<string, Range[]>;

    /**
     * Maps result action names to the ranges where they are referenced in the
     * document.
     *
     * Result references usually appear in attributes such as `render`, pointing
     * to actions that were previously defined.
     *
     * @example
     * ```html
     * <div render="foo"></div>
     * <div render="bar"></div>
     * ```
     * This produces:
     * - `"foo"` → [Range]
     * - `"bar"` → [Range]
     */
    result_references: Map<string, Range[]>;

    /**
     * A collection of {@link Diagnostic} entries generated for the document.
     *
     * Diagnostics represent validation issues, warnings, or errors identified
     * by the language service or extension logic. They can be surfaced to the
     * user in VS Code through squiggly underlines, Problems panel entries, etc.
     */
    diagnostics: Diagnostic[];
  }
}
