import { describe, expect, it, vi } from "vitest";

vi.mock("vscode-html-languageservice", () => ({
  getDefaultHTMLDataProvider: vi.fn(() => ({
    provideTags: vi.fn(() => [{ name: "defaultTag" }]),
  })),
  newHTMLDataProvider: vi.fn(() => ({
    provideTags: vi.fn(() => [{ name: "staticTag" }]),
    getId: vi.fn(),
  })),
  MarkupKind: {
    Markdown: "markdown",
  },
}));

vi.mock("./mergeDefinitions.mts", () => ({
  mergeDefinitions: vi.fn((a, b) => [...a, ...b]),
}));

describe("provideTags", () => {
  it("returns merged static + default tags", async () => {
    const { defaultProvider, provideTags, staticProvider } =
      await import("./provider.mts");
    const result = provideTags();

    expect(result).toEqual([{ name: "staticTag" }, { name: "defaultTag" }]);

    expect(staticProvider.provideTags).toHaveBeenCalled();
    expect(defaultProvider.provideTags).toHaveBeenCalled();
  });
});
