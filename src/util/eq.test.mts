import { describe, expect, it } from "vitest";
import { eq } from "./eq.mts";

describe("eq", () => {
  it("returns true when values match (loose equality)", () => {
    const ctx: [string, any] = ["a", 1];
    const obj = { a: 1 };

    expect(eq.call(ctx, obj)).toBe(true);
  });

  it("returns false when values differ", () => {
    const ctx: [string, any] = ["a", 1];
    const obj = { a: 2 };

    expect(eq.call(ctx, obj)).toBe(false);
  });

  it("uses loose equality (==)", () => {
    const ctx: [string, any] = ["a", 1];
    const obj = { a: "1" };

    expect(eq.call(ctx, obj)).toBe(true);
  });

  it("returns false when property is missing", () => {
    const ctx: [string, any] = ["a", 1];
    const obj = {};

    expect(eq.call(ctx, obj)).toBe(false);
  });
});
