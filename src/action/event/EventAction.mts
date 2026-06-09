import type { IAttributeData } from "vscode-html-languageservice";
import { Action, type Channel, type Options } from "../Action.mts";
import { getEventAttrs } from "./getEventAttrs.mts";
import { getMutationAttrs } from "./getMutationAttrs.mts";

/**
 * Implements the "event" action namespace, mapping attribute patterns into
 * event trigger and modifier attribute definitions.
 */
export class EventAction extends Action {
  override name: string = "event";
  override otherPrefix: string[] = ["on:attr:"];
  override output: Channel[] = [[/^on:/, [/^event:/]]];
  override input: Channel[] = [
    [
      /^on$/,
      [
        /^h-/,
        /^(debounce|error|if:error|if:loading|once|redirect|throttle|method|stream)$/,
      ],
    ],
    [/^reset$/, []],
    [/^clear-timeout$/, []],
    [/^scroll$/, [/^(relative|behavior|top|left)$/]],
  ];
  override other: Channel[] = [
    [
      /^(on|sse)$/,
      [/^(credentials|delete|get|post|put|result|href|action|src)$/],
    ],
    [/^(top|left)$/, [/^scroll$/], true],
  ];
  override options: Options[] = [
    [/^(debounce|throttle)$/, /^\d+(?:\.\d+)?$/, "rate limit", ["<number>"], 0],
    [
      /^behavior$/,
      /^(auto|instant|smooth)$/,
      "scroll behavior",
      ["auto", "instant", "smooth"],
      "auto",
    ],
    [
      /^(top|left)$/,
      /^(\-?\d+(?:\.\d+)?|start|center|end)$/,
      "scroll position",
      ["<number>", "start", "center", "end"],
    ],
    [
      /^redirect$/,
      /^(pushState|replaceState|assign|replace)$/,
      "redirect",
      ["pushState", "replaceState", "assign", "replace"],
    ],
  ];
  override tags: [string, RegExp][] = [
    ["method", /^form$/],
    ["action", /^form$/],
    ["href", /^(a|base|link)$/],
    ["src", /^(audio|embed|frame|iframe|img|input|script|source|track|video)$/],
  ];

  override provideAttributes({ name }: IAttributeData): IAttributeData[] {
    const result = getMutationAttrs(name);

    return name.length > 2 && name.startsWith("on") ?
        result.concat(getEventAttrs(name.slice(2)))
      : result;
  }

  override testParent(parent: string, child: string): boolean {
    return child.startsWith("event:") && parent === "on:" + child.slice(6);
  }
}
