import { describe, expect, it, vi } from "vitest";

vi.mock("../document/data.mts", () => ({
  documents: new Set([
    {
      identifiers: {
        registry: new Map([
          [
            "foo",
            {
              definitions: new Map([
                ["bar", null],
                ["baz", null],
              ]),
            },
          ],
        ]),
      },
    },
  ]),
}));

vi.mock("../util/t.mts", () => {
  const tpl = vi.fn().mockReturnValue("tpl");
  return { t: () => tpl };
});

import { provideActionValues } from "./provideActionValues.mts";

describe("provideActionValues", () => {
  it("constructs data", () => {
    const result = provideActionValues("foo" as any);
    expect(result.length).toBe(2);
    expect(result[0]?.name).toBe("bar");
  });
});
