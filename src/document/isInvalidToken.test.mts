import { describe, expect, it, vi } from "vitest";

vi.mock("./parseTokens.mts", () => ({
  INVALID_PATTERN: /^foo$/,
}));

vi.mock("./isValidToken.mts", () => ({
  NON_WHITESPACE_PATTERN: /^bar$/,
}));

import { isInvalidToken } from "./isInvalidToken.mts";

describe("isInvalidToken", () => {
  it("empty", () => {
    expect(isInvalidToken("")).toBeTruthy();
  });

  it("leading", () => {
    expect(isInvalidToken(" baz")).toBeTruthy();
  });

  it("trailing", () => {
    expect(isInvalidToken("baz ")).toBeTruthy();
  });

  it("non white", () => {
    expect(isInvalidToken("bar")).toBeFalsy();
  });

  it("valid", () => {
    expect(isInvalidToken("foo")).toBeFalsy();
  });

  it("invalid", () => {
    expect(isInvalidToken("baz")).toBeTruthy();
  });
});
