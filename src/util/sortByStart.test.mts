import { describe, expect, it } from "vitest";
import { sortByStart } from "./sortByStart.mts";

describe("sortByStart", () => {
  it("subtracts b.start from a.start", () => {
    expect(sortByStart({ start: 10 }, { start: 3 })).toBe(7);
  });

  it("returns negative result when a.start is smaller", () => {
    expect(sortByStart({ start: 2 }, { start: 5 })).toBe(-3);
  });

  it("returns 0 when values are equal", () => {
    expect(sortByStart({ start: 4 }, { start: 4 })).toBe(0);
  });
});
