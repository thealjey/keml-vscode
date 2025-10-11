/**
 * Represents a parsed token with its starting character index.
 */
interface ParsedToken {
  /**
   * The substring extracted from the input.
   */
  token: string;

  /**
   * The starting index of the token in the input string.
   */
  characterDelta: number;
}

export const INVALID_PATTERN = /[\(\)\[\]\<\>\{\}]/;

const GLOBAL_INVALID_PATTERN = new RegExp(INVALID_PATTERN, "g");

/**
 * Parses an input string into individual tokens, skipping invalid patterns.
 *
 * @param input String to tokenize.
 * @returns Array of parsed tokens with their starting character indices.
 */
export const parseTokens = (input: string) => {
  const result: ParsedToken[] = [];
  const len = input.length;
  const matches = Array.from(input.matchAll(GLOBAL_INVALID_PATTERN));
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

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("parseTokens", () => {
    it("returns empty array for empty input", () => {
      expect(parseTokens("")).toEqual([]);
    });

    it("splits input without invalid chars", () => {
      expect(parseTokens("foo bar")).toEqual([
        { token: "foo", characterDelta: 0 },
        { token: "bar", characterDelta: 4 },
      ]);
    });

    it("ignores tokens inside invalid boundaries", () => {
      expect(parseTokens("foo bar(baz) qux")).toEqual([
        { token: "foo", characterDelta: 0 },
        { token: "qux", characterDelta: 13 },
      ]);
    });

    it("handles invalid chars with no right space (boundary at end)", () => {
      expect(parseTokens("foo(bar)")).toEqual([]);
    });
  });
}
/* v8 ignore stop */
