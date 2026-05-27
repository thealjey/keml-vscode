import { describe, expect, it } from "vitest";
import { trimLeading } from "./trimLeading.mts";

describe("trimLeading", () => {
  it("removes prefix when value starts with this", () => {
    const result = trimLeading.call("foo", "foobar");
    expect(result).toBe("bar");
  });

  it("returns original string when prefix does not match", () => {
    const result = trimLeading.call("bar", "foobar");
    expect(result).toBe("foobar");
  });

  it("returns empty string when value equals prefix", () => {
    const result = trimLeading.call("foo", "foo");
    expect(result).toBe("");
  });

  it("does not modify value when it is shorter than prefix", () => {
    const result = trimLeading.call("foobar", "foo");
    expect(result).toBe("foo");
  });
});
