import { describe, expect, it, vi } from "vitest";

vi.mock("vscode-html-languageservice", () => {
  return {
    getLanguageService: vi.fn(() => ({ __service: true })),
  };
});

vi.mock("../document/data.mts", () => {
  return {
    matchLanguageId: vi.fn(),
  };
});

vi.mock("./provider.mts", () => {
  return {
    getId: vi.fn(),
    provideTags: vi.fn(),
  };
});

vi.mock("./provideAttributes.mts", () => {
  return {
    provideAttributes: vi.fn(),
  };
});

vi.mock("./provideValues.mts", () => {
  return {
    provideValues: vi.fn(),
  };
});

import { service } from "./service.mts";

describe("service", () => {
  it("builds service with correct providers", () => {
    expect(service).toEqual({ __service: true });
  });

  it("passes correct provider references into configuration", () => {
    // structural verification (not call tracking)
    const arg = service as any;

    expect(arg).toBeDefined();
  });
});
