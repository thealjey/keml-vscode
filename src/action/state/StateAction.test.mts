import { describe, expect, it, vi } from "vitest";

vi.mock("../Action.mts", () => ({
  Action: class {
    isAction = true;
  },
}));

vi.mock("./getStateAttrs.mts", () => ({
  getStateAttrs: vi.fn().mockReturnValue("bar"),
}));

import { StateAction } from "./StateAction.mts";
import { getStateAttrs } from "./getStateAttrs.mts";

const action = new StateAction();

describe("StateAction", () => {
  it("inherits", () => {
    expect((action as any).isAction).toBeTruthy();
  });

  it("provideAttributes - delegates to getStateAttrs", () => {
    const result = action.provideAttributes({ name: "foo" });
    expect(getStateAttrs).toHaveBeenCalledWith("foo");
    expect(result).toBe("bar");
  });
});
