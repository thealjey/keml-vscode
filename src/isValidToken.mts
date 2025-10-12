import { INVALID_PATTERN } from "./parseTokens.mts";

const NON_WHITESPACE_PATTERN = /^\S+$/;
const LEADING_WHITESPACE = /^\s/;
const TRAILING_WHITESPACE = /\s$/;

/**
 * Determines whether a token is **definitely valid**.
 *
 * A token is considered valid if it:
 * 1. Contains only non-whitespace characters.
 * 2. Does not contain any illegal characters as defined by `INVALID_PATTERN`.
 *
 * Tokens that contain illegal characters are **not considered valid** here
 * because their validity is ambiguous. Such tokens fall into a "maybe" category
 * and are neither valid nor invalid according to these functions.
 *
 * @param token - The string to check.
 * @returns `true` if the token is definitely valid, `false` otherwise.
 */
export const isValidToken = (token: string) =>
  NON_WHITESPACE_PATTERN.test(token) && !INVALID_PATTERN.test(token);

/**
 * Determines whether a token is **definitely invalid**.
 *
 * A token is considered invalid if it:
 * 1. Is empty.
 * 2. Starts or ends with whitespace.
 * 3. Contains a whitespace character and does not contain illegal characters.
 *
 * @param token - The string to check.
 * @returns `true` if the token is invalid, `false` otherwise.
 */
export const isInvalidToken = (token: string) =>
  !token ||
  LEADING_WHITESPACE.test(token) ||
  TRAILING_WHITESPACE.test(token) ||
  (!NON_WHITESPACE_PATTERN.test(token) && !INVALID_PATTERN.test(token));

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isValidToken / isInvalidToken", () => {
    it("returns true for definitely valid tokens", () => {
      expect(isValidToken("foo")).toBe(true);
      expect(isValidToken("bar123")).toBe(true);
    });

    it("returns false for definitely valid tokens on isInvalidToken", () => {
      expect(isInvalidToken("foo")).toBe(false);
      expect(isInvalidToken("bar123")).toBe(false);
    });

    it("returns true for definitely invalid tokens", () => {
      expect(isInvalidToken("")).toBe(true);
      expect(isInvalidToken(" foo")).toBe(true);
      expect(isInvalidToken("bar ")).toBe(true);
      expect(isInvalidToken("foo bar")).toBe(true);
    });

    it("returns false for definitely invalid tokens on isValidToken", () => {
      expect(isValidToken("")).toBe(false);
      expect(isValidToken(" foo")).toBe(false);
      expect(isValidToken("bar ")).toBe(false);
      expect(isValidToken("foo bar")).toBe(false);
    });

    it("returns false on both functions for maybe tokens", () => {
      expect(isValidToken("foo(bar)")).toBe(false);
      expect(isInvalidToken("foo(bar)")).toBe(false);

      expect(isValidToken("{}")).toBe(false);
      expect(isInvalidToken("{}")).toBe(false);

      expect(isValidToken("foo{bar}")).toBe(false);
      expect(isInvalidToken("foo{bar}")).toBe(false);
    });
  });
}
/* v8 ignore stop */
