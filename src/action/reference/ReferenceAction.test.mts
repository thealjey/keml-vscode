import { describe, expect, it, vi } from "vitest";

vi.mock("../Action.mts", () => ({
  Action: class {
    isAction = true;
  },
}));

vi.mock("./getReferenceAttrs.mts", () => ({
  getReferenceAttrs: vi.fn().mockReturnValue("bar"),
}));

import { ReferenceAction } from "./ReferenceAction.mts";
import { getReferenceAttrs } from "./getReferenceAttrs.mts";

const action = new ReferenceAction();

describe("ReferenceAction", () => {
  it("inherits", () => {
    expect((action as any).isAction).toBeTruthy();
  });

  it("provideAttributes - delegates to getReferenceAttrs", () => {
    const result = action.provideAttributes({ name: "foo" });
    expect(getReferenceAttrs).toHaveBeenCalledWith("foo");
    expect(result).toBe("bar");
  });
});
