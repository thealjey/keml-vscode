/**
 * Represents a parsed token with its starting character index.
 */
interface ParsedToken {
  /**
   * The substring extracted from the input string.
   */
  token: string;

  /**
   * The index in the input string where this token starts.
   */
  characterDelta: number;
}

/**
 * A regular expression matching characters considered invalid as standalone
 * tokens.
 * These include parentheses, brackets, angle brackets, and braces.
 */
export const INVALID_PATTERN = /[\(\)\[\]\<\>\{\}]/g;

/**
 * Splits an input string into tokens based on spaces, while ignoring ranges
 * that contain invalid characters (matched by {@link INVALID_PATTERN}).
 *
 * Tokens are sequences of non-space characters outside the "invalid" boundary.
 *
 * @param input - The input string to tokenize.
 * @returns An array of {@link ParsedToken} objects, each containing the token
 *          string and its starting index in the input.
 *
 * @example
 * ```ts
 * parseTokens("foo bar(baz) qux");
 * // Might return:
 * // [
 * //   { token: "foo", characterDelta: 0 },
 * //   { token: "qux", characterDelta: 13 }
 * // ]
 * ```
 */
export const parseTokens = (input: string) => {
  const result: ParsedToken[] = [];
  const len = input.length;
  const matches = Array.from(input.matchAll(INVALID_PATTERN));
  const first = matches[0];
  let i = 0;
  let characterDelta = -1;
  let leftBoundary = len;
  let rightBoundary = -1;

  if (first) {
    leftBoundary = input.lastIndexOf(" ", first.index);
    rightBoundary = input.indexOf(" ", matches[matches.length - 1]!.index);
    if (rightBoundary === -1) {
      rightBoundary = len;
    }
  }

  for (; i < len; ++i) {
    if (i > leftBoundary && i < rightBoundary) {
      characterDelta = -1;
    } else {
      if (input.charCodeAt(i) === 32) {
        if (characterDelta !== -1) {
          result.push({
            token: input.slice(characterDelta, i),
            characterDelta,
          });
          characterDelta = -1;
        }
      } else if (characterDelta === -1) {
        characterDelta = i;
      }
    }
  }

  if (characterDelta !== -1) {
    result.push({ token: input.slice(characterDelta, i), characterDelta });
  }

  return result;
};
