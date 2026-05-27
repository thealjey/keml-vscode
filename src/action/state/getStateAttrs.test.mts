import { describe, expect, it } from "vitest";

import { getStateAttrs } from "./getStateAttrs.mts";

describe("getStateAttrs", () => {
  it("returns 2 items", () => {
    const result = getStateAttrs("hola");
    expect(result.length).toBe(1);
    expect(result[0]?.name).toBe("x-hola");
  });
});
