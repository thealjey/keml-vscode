import type { IAttributeData } from "vscode-html-languageservice";
import { Action, type Channel, type Options } from "../Action.mts";
import { getReferenceAttrs } from "./getReferenceAttrs.mts";

/**
 * Implements the "reference" action namespace, producing attribute definitions
 * for ref/link binding semantics.
 */
export class ReferenceAction extends Action {
  override name: string = "reference";
  override otherPrefix: string[] = ["link:"];
  override output: Channel[] = [
    [/^ref:/, []],
    [/^(ref:width|ref:height)$/, [/^measure$/]],
  ];
  override input: Channel[] = [[/^link:/, []]];
  override options: Options[] = [
    [
      /^measure$/,
      /^(borderBoxSize|contentBoxSize|devicePixelContentBoxSize|contentRect)$/,
      "width/height measure",
      [
        "borderBoxSize",
        "contentBoxSize",
        "devicePixelContentBoxSize",
        "contentRect",
      ],
      "borderBoxSize",
    ],
  ];

  override provideAttributes({ name }: IAttributeData): IAttributeData[] {
    return getReferenceAttrs(name);
  }
}
