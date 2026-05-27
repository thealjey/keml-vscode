import { describe, expect, it } from "vitest";
import { getEventModifier } from "./getEventModifier.mts";

describe("getEventModifier", () => {
  it("returns 2 items", () => {
    expect(getEventModifier("hola").name).toBe("event:hola");
  });
});
