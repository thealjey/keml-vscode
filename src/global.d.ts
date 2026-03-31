import { Range } from "vscode";

declare global {
  type Document = import("./document.mjs", {
    with: { "resolution-mode": "import" },
  }).Document;

  /**
   * Represents a parsed attribute within a document.
   */
  interface Attr {
    /**
     * The name of the attribute.
     */
    name: string;

    /**
     * The value of the attribute.
     */
    value: string;

    /**
     * The starting offset of the attribute value in the document.
     */
    start?: number;

    /**
     * The ending offset of the attribute value in the document.
     */
    end?: number;

    /**
     * The range covering the attribute value.
     */
    range?: Range;

    /**
     * The range covering the entire attribute, from start to end.
     */
    fullRange: Range;
  }
}
