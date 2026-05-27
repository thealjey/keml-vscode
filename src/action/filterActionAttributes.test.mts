import { describe, expect, it, vi } from "vitest";

vi.mock("./actions.mts", () => ({
  actions: [
    { rejectAttribute: vi.fn((_node: any, value: string) => value === "foo") },
    { rejectAttribute: vi.fn((_node: any, value: string) => value === "bar") },
  ],
}));

vi.mock("./data.mts", () => ({
  getNode: () => "baz",
}));

import { actions } from "./actions.mts";
import { filterActionAttributes } from "./filterActionAttributes.mts";

describe("filterActionAttributes", () => {
  it("if not rejected", () => {
    expect(filterActionAttributes({ name: "hola" })).toBeTruthy();
    expect(actions[0]?.rejectAttribute).toHaveBeenCalledWith("baz", "hola");
    expect(filterActionAttributes({ name: "foo" })).toBeFalsy();
    expect(filterActionAttributes({ name: "bar" })).toBeFalsy();
  });
});
