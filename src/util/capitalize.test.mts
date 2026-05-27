import { describe, expect, it } from "vitest";
import { capitalize } from "./capitalize.mts";

describe("capitalize", () => {
  it("capitalizes first letter of a normal word", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("leaves already capitalized word unchanged except first char", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("works with single character strings", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("returns empty string unchanged", () => {
    expect(capitalize("")).toBe("");
  });

  it("does not change rest of string", () => {
    expect(capitalize("hELLO")).toBe("HELLO");
  });
});
