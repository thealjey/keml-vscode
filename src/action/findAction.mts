import { actions } from "./actions.mts";

/**
 * Resolves the first action whose input or output definition matches the given
 * name.
 */
export const findAction = (name: string) => {
  for (const action of actions) {
    if (action.isOutput(name) || action.isInput(name)) {
      return action;
    }
  }
};
