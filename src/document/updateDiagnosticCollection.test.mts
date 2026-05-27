import { describe, expect, it, vi } from "vitest";

vi.mock("./data.mts", () => ({
  diagnosticCollection: { clear: vi.fn() },
  documents: new Set([{ identifiers: { resolve: vi.fn() } }]),
}));

import { diagnosticCollection, documents } from "./data.mts";
import { updateDiagnosticCollection } from "./updateDiagnosticCollection.mts";

describe("updateDiagnosticCollection", () => {
  it("calls methods", () => {
    updateDiagnosticCollection();
    expect(diagnosticCollection.clear).toHaveBeenCalled();
    expect(
      Array.from(documents.values())[0]?.identifiers.resolve,
    ).toHaveBeenCalled();
  });
});
