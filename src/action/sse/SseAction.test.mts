import { describe, expect, it, vi } from "vitest";

vi.mock("../Action.mts", () => ({
  Action: class {
    isAction = true;
  },
}));

import { SseAction } from "./SseAction.mts";

const action = new SseAction();

describe("SseAction", () => {
  it("inherits", () => {
    expect((action as any).isAction).toBeTruthy();
  });
});
