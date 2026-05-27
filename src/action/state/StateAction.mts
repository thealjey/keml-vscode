import type { IAttributeData } from "vscode-html-languageservice";
import { Action, type Channel } from "../Action.mts";
import { getStateAttrs } from "./getStateAttrs.mts";

/**
 * Defines the "state" action namespace, mapping state-prefixed attributes
 * (`x-*`) and conditional (`if:*`) relationships into the action system.
 */
export class StateAction extends Action {
  override name: string = "state";
  override prefix: string[] = ["x-"];
  override output: Channel[] = [[/^if:/, []]];
  override input: Channel[] = [[/^if$/, [/^x-/]]];

  override provideAttributes({ name }: IAttributeData): IAttributeData[] {
    return getStateAttrs(name);
  }
}
