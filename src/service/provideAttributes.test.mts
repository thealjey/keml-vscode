import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- mocks must be defined before importing module under test ----

vi.mock("../action/filterActionAttributes.mts", () => {
  return {
    filterActionAttributes: vi.fn((attr: any) => {
      return attr; // default passthrough, tests can override if needed
    }),
  };
});

vi.mock("../action/provideActionAttributes.mts", () => {
  return {
    provideActionAttributes: vi.fn((x: any) => {
      return Array.isArray(x) ? x : [x];
    }),
  };
});

vi.mock("./mergeDefinitions.mts", () => {
  return {
    mergeDefinitions: vi.fn((a: any[], b: any[]) => {
      return [...a, ...b];
    }),
  };
});

vi.mock("./provider.mts", () => {
  return {
    staticProvider: {
      provideAttributes: vi.fn(() => ["static"]),
    },
    defaultProvider: {
      provideAttributes: vi.fn(() => ["default"]),
    },
  };
});

// ---- import AFTER mocks ----
import { filterActionAttributes } from "../action/filterActionAttributes.mts";
import { provideActionAttributes } from "../action/provideActionAttributes.mts";
import { mergeDefinitions } from "./mergeDefinitions.mts";
import { provideAttributes, providedAttributes } from "./provideAttributes.mts";
import { defaultProvider, staticProvider } from "./provider.mts";

describe("provideAttributes", () => {
  beforeEach(() => {
    providedAttributes.clear();
    vi.clearAllMocks();
  });

  it("computes attributes on first call (cache miss)", () => {
    const result = provideAttributes("div");

    expect(staticProvider.provideAttributes).toHaveBeenCalledWith("div");
    expect(defaultProvider.provideAttributes).toHaveBeenCalledWith("div");
    expect(mergeDefinitions).toHaveBeenCalled();

    expect(provideActionAttributes).toHaveBeenCalled();
    expect(filterActionAttributes).toHaveBeenCalled();

    expect(providedAttributes.has("div")).toBe(true);
    expect(result).toBeDefined();
  });

  it("uses cached value on second call (no recompute)", () => {
    const first = provideAttributes("span");
    const second = provideAttributes("span");

    expect(first).toMatchObject(second);

    expect(staticProvider.provideAttributes).toHaveBeenCalledTimes(1);
    expect(defaultProvider.provideAttributes).toHaveBeenCalledTimes(1);
    expect(mergeDefinitions).toHaveBeenCalledTimes(1);
    expect(provideActionAttributes).toHaveBeenCalledTimes(2);
  });

  it("returns filtered attributes", () => {
    // override filter behavior for deterministic test
    (filterActionAttributes as any).mockImplementation(
      (x: any) => x !== "remove",
    );

    const result = provideAttributes("button");

    expect(result).not.toContain("remove");
  });

  it("always filters even when cached", () => {
    const first = provideAttributes("a");

    (filterActionAttributes as any).mockImplementation(() => "filtered");

    const second = provideAttributes("a");

    expect(first).toMatchObject(second);

    // filtering still applied at runtime
    expect(filterActionAttributes).toHaveBeenCalled();
  });
});
