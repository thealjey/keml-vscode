import { describe, expect, it } from "vitest";
import { printable } from "./printable.mts";

describe("printable", () => {
  it("stringifies primitive values", () => {
    expect(printable("hello")).toBe('"hello"');
    expect(printable(123)).toBe("123");
    expect(printable(true)).toBe("true");
    expect(printable(null)).toBe("null");
  });

  it("handles arrays of primitives", () => {
    expect(printable([1, 2, 3])).toBe("1, 2, 3");
  });

  it("recursively handles nested arrays", () => {
    expect(printable([1, [2, 3]])).toBe("1, 2, 3");
  });

  it("handles mixed values", () => {
    expect(printable(["a", 1, null])).toBe('"a", 1, null');
  });
});
