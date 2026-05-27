import { describe, expect, it } from "vitest";
import { combineIterators } from "./combineIterators.mts";

describe("combineIterators", () => {
  it("yields items from a single iterator", () => {
    function* a() {
      yield 1;
      yield 2;
    }

    const result = [...combineIterators(a())];

    expect(result).toEqual([1, 2]);
  });

  it("yields items from multiple iterators in order", () => {
    function* a() {
      yield 1;
      yield 2;
    }

    function* b() {
      yield 3;
      yield 4;
    }

    const result = [...combineIterators(a(), b())];

    expect(result).toEqual([1, 2, 3, 4]);
  });

  it("handles empty iterators", () => {
    function* empty() {}

    const result = [...combineIterators(empty(), empty())];

    expect(result).toEqual([]);
  });
});
