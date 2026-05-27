import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CancellationToken, Position, TextDocument } from "vscode";

// ---- mocks (must be before import)
const provideReferencesMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn((uri: string) => {
        if (uri === "file:///test") {
          return {
            provideReferences: provideReferencesMock,
          };
        }
        return undefined;
      }),
    },
  };
});

// import AFTER mock
import { referenceProvider } from "./referenceProvider.mts";

// helpers
function makeDocument(uri = "file:///test"): TextDocument {
  return {
    uri: { toString: () => uri },
  } as unknown as TextDocument;
}

function makePosition(): Position {
  return {} as Position;
}

function makeContext(): any {
  return {};
}

function makeToken(cancelled = false): CancellationToken {
  return {
    isCancellationRequested: cancelled,
  } as CancellationToken;
}

describe("referenceProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls provideReferences when not cancelled", () => {
    const doc = makeDocument();
    const pos = makePosition();
    const ctx = makeContext();
    const token = makeToken(false);

    provideReferencesMock.mockReturnValue(["ref1", "ref2"]);

    const result = referenceProvider.provideReferences(doc, pos, ctx, token);

    expect(result).toEqual(["ref1", "ref2"]);
    expect(provideReferencesMock).toHaveBeenCalledWith(pos, ctx);
  });

  it("returns undefined when cancelled", () => {
    const doc = makeDocument();
    const pos = makePosition();
    const ctx = makeContext();
    const token = makeToken(true);

    const result = referenceProvider.provideReferences(doc, pos, ctx, token);

    expect(result).toBeUndefined();
    expect(provideReferencesMock).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    const doc = makeDocument("file:///missing");
    const pos = makePosition();
    const ctx = makeContext();
    const token = makeToken(false);

    const result = referenceProvider.provideReferences(doc, pos, ctx, token);

    expect(result).toBeUndefined();
  });
});
