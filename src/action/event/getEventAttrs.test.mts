import { describe, expect, it, vi } from "vitest";

vi.mock("./getEventModifier.mts", () => ({
  getEventModifier: () => "event modifier",
}));

import { getEventAttrs } from "./getEventAttrs.mts";

describe("getEventAttrs", () => {
  it("returns 2 items", () => {
    const result = getEventAttrs("hola");
    expect(result.length).toBe(2);
    expect(result[0]?.name).toBe("on:hola");
    expect(result[1]).toBe("event modifier");
  });
});
