import { describe, expect, it, vi } from "vitest";

vi.mock("../Action.mts", () => ({
  Action: class {
    isAction = true;
  },
}));

vi.mock("./getMutationAttrs.mts", () => ({
  getMutationAttrs: () => ["foo"],
}));

vi.mock("./getEventAttrs.mts", () => ({
  getEventAttrs: () => ["bar", "baz"],
}));

import { EventAction } from "./EventAction.mts";

const action = new EventAction();

describe("EventAction", () => {
  it("inherits", () => {
    expect((action as any).isAction).toBeTruthy();
  });

  it("provideAttributes - too short", () => {
    const result = action.provideAttributes({ name: "on" });
    expect(result.length).toBe(1);
  });

  it("provideAttributes - no event", () => {
    const result = action.provideAttributes({ name: "foo" });
    expect(result.length).toBe(1);
  });

  it("provideAttributes - event", () => {
    const result = action.provideAttributes({ name: "onclick" });
    expect(result.length).toBe(3);
  });

  it("testParent - not modifier", () => {
    expect(action.testParent("on:click", "foo")).toBeFalsy();
  });

  it("testParent - not event", () => {
    expect(action.testParent("foo", "event:click")).toBeFalsy();
  });

  it("testParent - tested", () => {
    expect(action.testParent("on:click", "event:click")).toBeTruthy();
  });
});
