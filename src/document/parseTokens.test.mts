import { describe, expect, it } from "vitest";
import { parseTokens } from "./parseTokens.mts";

describe("parseTokens", () => {
  it("simple input", () => {
    expect(parseTokens("foo bar")).toMatchObject([
      { token: "foo", characterDelta: 0 },
      { token: "bar", characterDelta: 4 },
    ]);
  });

  it("has placeholder", () => {
    expect(parseTokens("foo { 5 } bar")).toMatchObject([
      { token: "foo", characterDelta: 0 },
      { token: "bar", characterDelta: 10 },
    ]);
  });

  it("starts with placeholder", () => {
    expect(parseTokens("{ 5 } foo bar")).toMatchObject([
      { token: "foo", characterDelta: 6 },
      { token: "bar", characterDelta: 10 },
    ]);
  });

  it("ends with placeholder", () => {
    expect(parseTokens("foo bar { 5 }")).toMatchObject([
      { token: "foo", characterDelta: 0 },
      { token: "bar", characterDelta: 4 },
    ]);
  });
});
