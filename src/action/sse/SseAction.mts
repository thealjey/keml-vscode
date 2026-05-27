import { Action, type Channel } from "../Action.mts";

/**
 * Defines the "sse" action namespace and its associated attribute channel
 * mapping.
 */
export class SseAction extends Action {
  override name: string = "sse";
  override other: Channel[] = [[/^sse$/, []]];
}
