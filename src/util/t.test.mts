import { describe, expect, it, vi } from "vitest";

vi.mock("./capitalize.mts", () => ({
  capitalize: (v: any) => `CAP(${v})`,
}));

vi.mock("./printable.mts", () => ({
  printable: (v: any) => `P(${v})`,
}));

import { t } from "./t.mts";

describe("t", () => {
  it("runs printable when no mask is set", () => {
    const tmpl = t`a=${"a"}`;
    const result = tmpl({ a: "x" });

    expect(result).toBe("a=P(x)");
  });

  it("PLAIN (1) disables printable", () => {
    const tmpl = t`a=${"a|1"}`;
    const result = tmpl({ a: "x" });

    expect(result).toBe("a=x");
  });

  it("CAPS (2) still runs printable", () => {
    const tmpl = t`a=${"a|10"}`;
    const result = tmpl({ a: "x" });

    expect(result).toBe("a=P(CAP(x))");
  });

  it("CAPS + PLAIN (3) disables printable but keeps CAPS", () => {
    const tmpl = t`a=${"a|11"}`;
    const result = tmpl({ a: "x" });

    expect(result).toBe("a=CAP(x)");
  });
});
