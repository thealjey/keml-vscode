import { describe, expect, it } from "vitest";
import { eqIn } from "./eqIn.mts";

describe("eqIn", () => {
  it("returns true when values match for key", () => {
    const left = ["a", { a: 1 }];
    const right = { a: 1 };

    expect(eqIn.call(left as any, right)).toBe(true);
  });

  it("returns false when values differ", () => {
    const left = ["a", { a: 1 }];
    const right = { a: 2 };

    expect(eqIn.call(left as any, right)).toBe(false);
  });

  it("uses loose equality (==)", () => {
    const left = ["a", { a: 1 }];
    const right = { a: "1" };

    expect(eqIn.call(left as any, right)).toBe(true);
  });

  it("returns undefined comparison as false", () => {
    const left = ["a", { a: 1 }];
    const right = {};

    expect(eqIn.call(left as any, right)).toBe(false);
  });
});
