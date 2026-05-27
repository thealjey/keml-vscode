import { describe, expect, it, vi } from "vitest";

vi.mock("./parseTokens.mts", () => ({
  INVALID_PATTERN: /^foo$/,
}));

import { isValidToken } from "./isValidToken.mts";

describe("isValidToken", () => {
  it("spaces", () => {
    expect(isValidToken(" bar")).toBeFalsy();
  });

  it("invalid", () => {
    expect(isValidToken("foo")).toBeFalsy();
  });

  it("valid", () => {
    expect(isValidToken("bar")).toBeTruthy();
  });
});
