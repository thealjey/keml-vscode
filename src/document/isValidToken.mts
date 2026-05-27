import { INVALID_PATTERN } from "./parseTokens.mts";

export const NON_WHITESPACE_PATTERN = /^\S+$/;

/**
 * Checks whether a token is definitely valid.
 *
 * Returns `true` only if the token satisfies all validity rules with certainty.
 * Returns `false` for invalid tokens or tokens that cannot be classified as
 * valid.
 */
export const isValidToken = (token: string) =>
  NON_WHITESPACE_PATTERN.test(token) && !INVALID_PATTERN.test(token);
