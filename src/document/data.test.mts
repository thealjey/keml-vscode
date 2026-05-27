import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  languages: { createDiagnosticCollection: vi.fn() },
}));

import {
  getLanguageIds,
  matchLanguageId,
  matchUri,
  setGlobs,
  setLanguageIds,
} from "./data.mts";

describe("data", () => {
  it("setGlobs", () => {
    setGlobs(["foo", "bar"], ["foo"]);
    expect(matchUri({ path: "foo" } as any)).toBeTruthy();
    expect(matchUri({ path: "bar" } as any)).toBeFalsy();
  });

  it("setLanguageIds", () => {
    expect(setLanguageIds(new Set(["baz"]))).toBe(getLanguageIds());
    expect(matchLanguageId("baz")).toBeTruthy();
  });
});
