import { describe, expect, it, vi } from "vitest";

vi.mock("./actions.mts", () => ({
  actions: [
    {
      isOutput: (value: string) => value === "foo",
      isInput: (value: string) => value === "bar",
    },
    {
      isOutput: (value: string) => value === "qaz",
      isInput: (value: string) => value === "wsx",
    },
  ],
}));

import { actions } from "./actions.mts";
import { findAction } from "./findAction.mts";

describe("findAction", () => {
  it("picks action", () => {
    expect(findAction("hola")).toBeFalsy();
    expect(findAction("foo")).toBe(actions[0]);
    expect(findAction("bar")).toBe(actions[0]);
    expect(findAction("qaz")).toBe(actions[1]);
    expect(findAction("wsx")).toBe(actions[1]);
  });
});
