import type { Action } from "./Action.mts";
import { EventAction } from "./event/EventAction.mts";
import { ReferenceAction } from "./reference/ReferenceAction.mts";
import { ResultAction } from "./result/ResultAction.mts";
import { SseAction } from "./sse/SseAction.mts";
import { StateAction } from "./state/StateAction.mts";

export const actions: Action[] = [
  new EventAction(),
  new ResultAction(),
  new StateAction(),
  new ReferenceAction(),
  new SseAction(),
];

const prefixes = actions.flatMap(({ prefix }) => prefix);
const combinedPrefixes = prefixes.concat(
  actions.flatMap(({ otherPrefix }) => otherPrefix),
);
const pattern = new RegExp(`^(${prefixes.join("|")})*`);
const combinedPatten = new RegExp(`^(${combinedPrefixes.join("|")})*`);

export const baseName = (name: string) => name.replace(pattern, "");

export const combinedBaseName = (name: string) =>
  name.replace(combinedPatten, "");

for (const action of actions) {
  action.prefixes = prefixes;
  action.combinedPrefixes = combinedPrefixes;
  action.baseName = baseName;
  action.combinedBaseName = combinedBaseName;
}
