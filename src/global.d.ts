import type { Range } from "vscode";
import type { Document as KEMLDocument } from "./document/Document.mts" with {
  "resolution-mode": "import",
};
import type { Node as KEMLNode } from "./document/Node.mts" with {
  "resolution-mode": "import",
};

declare global {
  type Node = KEMLNode;
  type Document = KEMLDocument;

  interface Array<T> {
    map<U, This>(
      callbackfn: (this: This, value: T, index: number, array: T[]) => U,
      thisArg: This,
    ): U[];
    some<This>(
      predicate: (this: This, value: T, index: number, array: T[]) => unknown,
      thisArg: This,
    ): boolean;
  }

  /**
   * Represents a parsed attribute within a document.
   */
  interface Attr {
    /**
     * The name of the attribute.
     */
    readonly name: string;

    /**
     * The value of the attribute.
     */
    readonly value: string;

    /**
     * The starting offset of the attribute value in the document.
     */
    readonly start?: number;

    /**
     * The ending offset of the attribute value in the document.
     */
    readonly end?: number;

    /**
     * The range covering the attribute value.
     */
    readonly range?: Range;

    /**
     * The range covering the entire attribute, from start to end.
     */
    readonly fullRange: Range;

    /**
     * The node instance that this attribute belongs to.
     */
    readonly node: Node;
  }
}
