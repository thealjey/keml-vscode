import { describe, expect, it, vi } from "vitest";

vi.mock("./actions.mts", () => ({
  actions: [
    { provideAttributes: () => ["aaa", "bbb"] },
    { provideAttributes: () => ["ccc"] },
  ],
}));

import { provideActionAttributes } from "./provideActionAttributes.mts";

describe("provideActionAttributes", () => {
  it("flattens action results", () => {
    const result = provideActionAttributes("foo" as any);
    expect(result.length).toBe(4);
    expect(result).toEqual(["foo", "aaa", "bbb", "ccc"]);
  });
});
