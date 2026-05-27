import { describe, expect, it } from "vitest";
import { getReferenceAttrs } from "./getReferenceAttrs.mts";

describe("getReferenceAttrs", () => {
  it("returns 2 items", () => {
    const result = getReferenceAttrs("hola");
    expect(result.length).toBe(2);
    expect(result[0]?.name).toBe("ref:hola");
    expect(result[1]?.name).toBe("link:hola");
  });
});
