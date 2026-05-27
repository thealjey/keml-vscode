import { describe, expect, it } from "vitest";
import { isNotNil } from "./isNotNil.mts";

describe("isNotNil", () => {
  it("returns false for null", () => {
    expect(isNotNil(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isNotNil(undefined)).toBe(false);
  });

  it("returns true for 0", () => {
    expect(isNotNil(0)).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isNotNil("")).toBe(true);
  });

  it("returns true for objects", () => {
    expect(isNotNil({})).toBe(true);
  });
});
