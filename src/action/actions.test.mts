import { describe, expect, it, vi } from "vitest";

vi.mock("./event/EventAction.mts", () => ({
  EventAction: class {
    prefix = ["a"];
    otherPrefix = ["b"];
  },
}));

vi.mock("./result/ResultAction.mts", () => ({
  ResultAction: class {
    prefix = ["c"];
    otherPrefix = ["d"];
  },
}));

vi.mock("./state/StateAction.mts", () => ({
  StateAction: class {
    prefix = ["e"];
    otherPrefix = ["f"];
  },
}));

vi.mock("./reference/ReferenceAction.mts", () => ({
  ReferenceAction: class {
    prefix = ["g"];
    otherPrefix = ["h"];
  },
}));

vi.mock("./sse/SseAction.mts", () => ({
  SseAction: class {
    prefix = ["i"];
    otherPrefix = ["j"];
  },
}));

import { baseName, combinedBaseName } from "./actions.mts";

describe("actions", () => {
  it("remove prefix", () => {
    expect(baseName("czx")).toBe("zx");
    expect(baseName("bzx")).toBe("bzx");
    expect(combinedBaseName("azx")).toBe("zx");
    expect(combinedBaseName("jzx")).toBe("zx");
  });
});
