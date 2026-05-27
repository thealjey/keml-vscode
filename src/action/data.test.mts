import { describe, expect, it } from "vitest";
import { getNode, setNode } from "./data.mts";

describe("data", () => {
  it("node", () => {
    const node = getNode();
    expect(setNode("foo" as any)).toBe("foo");
    expect(getNode()).toBe("foo");
    setNode(node);
  });
});
