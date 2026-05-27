import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./configure.mts", () => {
  return {
    configure: vi.fn(),
  };
});

import { configure } from "./configure.mts";
import { onDidChangeConfiguration } from "./onDidChangeConfiguration.mts";

const mockConfigure = configure as unknown as ReturnType<typeof vi.fn>;

function createEvent(opts: {
  keml?: boolean;
  search?: boolean;
  warnOnLogAttribute?: boolean;
}) {
  return {
    affectsConfiguration: (key: string) => {
      if (key === "keml") {
        return !!opts.keml;
      }
      if (key === "search") {
        return !!opts.search;
      }
      if (key === "keml.warnOnLogAttribute") {
        return !!opts.warnOnLogAttribute;
      }
      return false;
    },
  };
}

describe("onDidChangeConfiguration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when no relevant configuration changed", () => {
    const result = onDidChangeConfiguration(
      createEvent({ keml: false, search: false }),
    );

    expect(result).toBe(false);
    expect(mockConfigure).not.toHaveBeenCalled();
  });

  it("calls configure when keml changes", () => {
    mockConfigure.mockReturnValue(true);

    const result = onDidChangeConfiguration(
      createEvent({ keml: true, warnOnLogAttribute: true }),
    );

    expect(mockConfigure).toHaveBeenCalledWith(true);
    expect(result).toBe(true);
  });

  it("calls configure when search changes", () => {
    mockConfigure.mockReturnValue(true);

    const result = onDidChangeConfiguration(
      createEvent({ search: true, warnOnLogAttribute: false }),
    );

    expect(mockConfigure).toHaveBeenCalledWith(false);
    expect(result).toBe(true);
  });

  it("does not call configure when only unrelated config changes", () => {
    const result = onDidChangeConfiguration(
      createEvent({ keml: false, search: false, warnOnLogAttribute: true }),
    );

    expect(result).toBe(false);
    expect(mockConfigure).not.toHaveBeenCalled();
  });
});
