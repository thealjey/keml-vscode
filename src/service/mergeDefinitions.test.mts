import { describe, expect, it } from "vitest";
import { mergeDefinitions } from "./mergeDefinitions.mts";

describe("mergeDefinitions", () => {
  it("produces value", () => {
    expect(
      mergeDefinitions(
        [
          {
            name: "foo",
            baz: 42 as any,
            wer: [{ name: "a" }],
            sdf: { name: "d" },
          },
        ],
        [
          { name: "foo", baz: [43], wer: [{ name: "b" }], sdf: { name: "c" } },
          { name: "bar" },
        ],
      ),
    ).toMatchObject([
      {
        name: "foo",
        baz: [43],
        wer: [{ name: "a" }, { name: "b" }],
        sdf: { name: "c" },
      },
      { name: "bar" },
    ]);
  });
});
