import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  languages: {},
}));

vi.mock("../action/actions.mts", () => ({
  actions: [],
  baseName: vi.fn(),
}));

vi.mock("../action/provideActionValues.mts", () => ({
  provideActionValues: vi.fn(),
}));

vi.mock("./mergeDefinitions.mts", () => ({
  mergeDefinitions: vi.fn(),
}));

vi.mock("./provider.mts", () => ({
  staticProvider: {
    provideValues: vi.fn(),
  },
  defaultProvider: {
    provideValues: vi.fn(),
  },
}));

import { actions, baseName } from "../action/actions.mts";
import { provideActionValues } from "../action/provideActionValues.mts";
import { mergeDefinitions } from "./mergeDefinitions.mts";
import { defaultProvider, staticProvider } from "./provider.mts";
import { providedValues, provideValues } from "./provideValues.mts";

describe("provideValues", () => {
  beforeEach(() => {
    providedValues.clear();
    vi.clearAllMocks();
    (actions as any[]).length = 0;
  });

  it("returns action values when attribute matches action input", () => {
    const action = { isInput: vi.fn(() => true) };
    (actions as any[]).push(action);

    const result = [{ value: "action" }];
    (provideActionValues as any).mockReturnValue(result);

    const res = provideValues("tag", "attr");

    expect(provideActionValues).toHaveBeenCalledWith(action);
    expect(res).toBe(result);
  });

  it("uses staticProvider when baseName equals attribute", () => {
    const action = { isInput: vi.fn(() => false) };
    (actions as any[]).push(action);

    (baseName as any).mockReturnValue("attr");

    const staticResult = [{ value: "static" }];
    (staticProvider.provideValues as any).mockReturnValue(staticResult);

    const res = provideValues("tag", "attr");

    expect(staticProvider.provideValues).toHaveBeenCalledWith("tag", "attr");
    expect(res).toBe(staticResult);
  });

  it("merges static + default provider when baseName differs", () => {
    const action = { isInput: vi.fn(() => false) };
    (actions as any[]).push(action);

    (baseName as any).mockReturnValue("base");

    const staticResult = [{ value: "static" }];
    const defaultResult = [{ value: "default" }];
    const mergedResult = [{ value: "merged" }];

    (staticProvider.provideValues as any).mockReturnValue(staticResult);
    (defaultProvider.provideValues as any).mockReturnValue(defaultResult);
    (mergeDefinitions as any).mockReturnValue(mergedResult);

    const res = provideValues("tag", "attr");

    expect(staticProvider.provideValues).toHaveBeenCalledWith("tag", "base");
    expect(defaultProvider.provideValues).toHaveBeenCalledWith("tag", "base");
    expect(mergeDefinitions).toHaveBeenCalledWith(staticResult, defaultResult);
    expect(res).toBe(mergedResult);
  });

  it("caches results per tag+attribute", () => {
    const action = { isInput: vi.fn(() => false) };
    (actions as any[]).push(action);

    (baseName as any).mockReturnValue("attr");

    const staticResult = [{ value: "static" }];
    (staticProvider.provideValues as any).mockReturnValue(staticResult);

    const first = provideValues("tag", "attr");
    const second = provideValues("tag", "attr");

    expect(first).toBe(second);
    expect(staticProvider.provideValues).toHaveBeenCalledTimes(1);
  });
});
