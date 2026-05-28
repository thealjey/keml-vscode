import { Action, type Channel, type Options } from "../Action.mts";

/**
 * Defines the "result" action namespace, including output, input, and option
 * rules for render lifecycle attributes.
 */
export class ResultAction extends Action {
  override name: string = "result";
  override output: Channel[] = [
    [/^result$/, []],
    [/^error$/, []],
  ];
  override input: Channel[] = [[/^render$/, [/^position$/, /^transition$/]]];
  override options: Options[] = [
    [
      /^position$/,
      new RegExp(`^(replaceChildren|replaceWith|before|after|prepend|append)$`),
      "render position",
      [
        "replaceChildren",
        "replaceWith",
        "before",
        "after",
        "prepend",
        "append",
      ],
      "replaceChildren",
    ],
  ];
}
