import { describe, expect, it, vi } from "vitest";

vi.mock("../Action.mts", () => ({
  Action: class {
    isAction = true;
  },
}));

import { ResultAction } from "./ResultAction.mts";

const action = new ResultAction();

describe("ResultAction", () => {
  it("inherits", () => {
    expect((action as any).isAction).toBeTruthy();
  });
});
