import { describe, expect, it } from "vitest";

import { getLanguageExtensions } from "./getLanguageExtensions.mts";

describe("getLanguageExtensions", () => {
  it("returns flattened and trimmed extensions for matching language", () => {
    const result = getLanguageExtensions.call("ts", {
      packageJSON: {
        contributes: {
          languages: [
            {
              id: "ts",
              extensions: [".ts", ".tsx"],
            },
          ],
        },
      },
    });

    expect(result).toEqual(["ts", "tsx"]);
  });

  it("filters out non-matching languages", () => {
    const result = getLanguageExtensions.call("ts", {
      packageJSON: {
        contributes: {
          languages: [
            {
              id: "js",
              extensions: [".js"],
            },
          ],
        },
      },
    });

    expect(result).toEqual([]);
  });

  it("flattens multiple matching entries", () => {
    const result = getLanguageExtensions.call("ts", {
      packageJSON: {
        contributes: {
          languages: [
            {
              id: "ts",
              extensions: [".ts"],
            },
            {
              id: "ts",
              extensions: [".tsx"],
            },
          ],
        },
      },
    });

    expect(result).toEqual(["ts", "tsx"]);
  });

  it("filters out undefined extensions safely", () => {
    const result = getLanguageExtensions.call("ts", {
      packageJSON: {
        contributes: {
          languages: [
            {
              id: "ts",
              extensions: undefined,
            },
          ],
        },
      } as any,
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when packageJSON is missing", () => {
    const result = getLanguageExtensions.call("ts", {});

    expect(result).toEqual([]);
  });
});
