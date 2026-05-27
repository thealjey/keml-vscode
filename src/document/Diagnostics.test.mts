import { describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => ({
  Diagnostic: class {
    constructor(
      public range: any,
      public message: any,
      public severity: any,
    ) {}
  },
  DiagnosticSeverity: { Warning: "warn" },
}));

vi.mock("../action/actions.mts", () => ({
  actions: [{ provideDiagnostics: () => ["action diag"] }],
  combinedBaseName: vi.fn((value: string) => value.slice(2)),
}));

vi.mock("./data.mts", () => ({
  config: {},
}));

import { Diagnostics } from "./Diagnostics.mts";
import { config } from "./data.mts";

describe("Diagnostics", () => {
  it("associate - no log/warn", () => {
    const diag = new Diagnostics();
    diag.associate({ name: "foo" } as any);
    expect(diag.data.length).toBe(1);
    expect(diag.hasLog).toBe(false);
  });

  it("associate - log, no warn", () => {
    const diag = new Diagnostics();
    diag.associate({ name: "x-log" } as any);
    expect(diag.data.length).toBe(1);
    expect(diag.hasLog).toBe(true);
  });

  it("associate - log/warn", () => {
    const diag = new Diagnostics();
    config.WARN_LOG = true;
    diag.associate({ name: "x-log" } as any);
    expect(diag.data.length).toBe(2);
    expect(diag.hasLog).toBe(true);
  });
});
