import { describe, expect, it, vi } from "vitest";

vi.mock("./getEventModifier.mts", () => ({
  getEventModifier: () => "event modifier",
}));

import { getMutationAttrs } from "./getMutationAttrs.mts";

describe("getMutationAttrs", () => {
  it("returns 2 items", () => {
    const result = getMutationAttrs("hola");
    expect(result.length).toBe(2);
    expect(result[0]?.name).toBe("on:attr:hola");
    expect(result[1]).toBe("event modifier");
  });
});
