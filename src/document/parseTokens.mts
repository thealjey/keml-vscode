interface ParsedToken {
  token: string;
  characterDelta: number;
}

export const INVALID_PATTERN = /[\(\)\[\]\<\>\{\}]/;

const GLOBAL_INVALID_PATTERN = new RegExp(INVALID_PATTERN, "g");

/**
 * Parses a string into tokens with their character offsets.
 *
 * Certain regions of the input are excluded from tokenization based on invalid
 * patterns.
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
