import { describe, expect, it } from "vitest";
import { get } from "./get.mts";

describe("get", () => {
  it("retrieves value by key from object using this context", () => {
    const obj = { a: 1, b: 2 };

    const result = get.call("a", obj);

    expect(result).toBe(1);
  });

  it("returns undefined when key does not exist", () => {
    const obj = { a: 1 };

    const result = (get as any).call("b", obj);

    expect(result).toBeUndefined();
  });

  it("works with numeric keys", () => {
    const obj = { 1: "one" };

    const result = get.call(1, obj);

    expect(result).toBe("one");
  });
});
