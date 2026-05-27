import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  return {
    extensions: {
      all: [],
    },
  };
});

vi.mock("./getLanguageExtensions.mts", () => {
  return {
    getLanguageExtensions: vi.fn(),
  };
});

import { extensions } from "vscode";
import { getAllLanguageExtensions } from "./getAllLanguageExtensions.mts";
import { getLanguageExtensions } from "./getLanguageExtensions.mts";

beforeEach(() => {
  vi.clearAllMocks();
  (extensions.all as any).length = 0;
});

describe("getAllLanguageExtensions", () => {
  it("maps over all extensions and flattens results", () => {
    (extensions.all as any).push({}, {}, {});

    (getLanguageExtensions as any).mockReturnValue(["a"]);

    const result = getAllLanguageExtensions("ts");

    expect(result).toEqual(["a", "a", "a"]);
    expect(getLanguageExtensions).toHaveBeenCalledTimes(3);
  });

  it("returns empty array when no extensions exist", () => {
    const result = getAllLanguageExtensions("ts");

    expect(result).toEqual([]);
  });

  it("binds languageId as thisArg", () => {
    (extensions.all as any).push({});

    let capturedThis: any;

    (getLanguageExtensions as any).mockImplementation(function (this: string) {
      capturedThis = this;
      return [];
    });

    getAllLanguageExtensions("python");

    expect(capturedThis).toBe("python");
  });
});
