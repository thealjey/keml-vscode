import { Range } from "vscode";
import { addRange } from "./addRange";
import { parseTokens } from "./parseTokens";

/**
 * Adds individual ranges for each token parsed from a string into a Map.
 *
 * This function splits the `value` string into tokens using
 * {@link parseTokens}, then adds a `Range` for each token to the provided
 * `store` using {@link addRange}.
 * The range for each token is calculated relative to the given `range.start`.
 *
 * @param store - A map from token strings to arrays of {@link Range} objects.
 * @param value - The string containing one or more tokens to add ranges for.
 * @param range - The base {@link Range} used to calculate token ranges.
 *
 * @example
 * ```ts
 * const store = new Map<string, Range[]>();
 * const value = "foo bar";
 * const baseRange = new Range(0, 0, 0, 7);
 * addDefinitionRanges(store, value, baseRange);
 * // store now contains separate ranges for "foo" and "bar"
 * ```
 */
export const addDefinitionRanges = (
  store: Map<string, Range[]>,
  value: string,
  range: Range
) => {
  for (const { token, characterDelta } of parseTokens(value)) {
    addRange(
      store,
      token,
      range.with({
        start: range.start.translate({ characterDelta }),
        end: range.start.translate({
          characterDelta: characterDelta + token.length,
        }),
      })
    );
  }
};
