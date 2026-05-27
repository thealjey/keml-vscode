import { NON_WHITESPACE_PATTERN } from "./isValidToken.mts";
import { INVALID_PATTERN } from "./parseTokens.mts";

const LEADING_WHITESPACE = /^\s/;
const TRAILING_WHITESPACE = /\s$/;

/**
 * Checks whether a token is definitely invalid.
 *
 * Returns `true` only if the token violates validity rules with certainty.
 * Returns `false` for valid tokens or tokens whose validity cannot be
 * determined.
 */
export const isInvalidToken = (token: string) =>
  !token ||
  LEADING_WHITESPACE.test(token) ||
  TRAILING_WHITESPACE.test(token) ||
  (!NON_WHITESPACE_PATTERN.test(token) && !INVALID_PATTERN.test(token));
