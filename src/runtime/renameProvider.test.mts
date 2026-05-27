import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CancellationToken, Position, TextDocument } from "vscode";

// ---- mocks (must be declared before importing module under test)
const provideRenameEditsMock = vi.fn();
const prepareRenameMock = vi.fn();

vi.mock("../document/data.mts", () => {
  return {
    documents: {
      get: vi.fn((uri: string) => {
        if (uri === "file:///test") {
          return {
            provideRenameEdits: provideRenameEditsMock,
            prepareRename: prepareRenameMock,
          };
        }
        return undefined;
      }),
    },
  };
});

// import AFTER mock
import { renameProvider } from "./renameProvider.mts";

// helpers
function makeDocument(uri = "file:///test"): TextDocument {
  return {
    uri: { toString: () => uri },
  } as unknown as TextDocument;
}

function makePosition(): Position {
  return {} as Position;
}

function makeToken(cancelled = false): CancellationToken {
  return {
    isCancellationRequested: cancelled,
  } as CancellationToken;
}

describe("renameProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls provideRenameEdits when not cancelled", () => {
    const doc = makeDocument();
    const pos = makePosition();
    const token = makeToken(false);

    provideRenameEditsMock.mockReturnValue("ok");

    const result = renameProvider.provideRenameEdits(
      doc,
      pos,
      "newName",
      token,
    );

    expect(result).toBe("ok");
    expect(provideRenameEditsMock).toHaveBeenCalledWith(pos, "newName");
  });

  it("returns undefined when cancelled (provideRenameEdits)", () => {
    const doc = makeDocument();
    const pos = makePosition();
    const token = makeToken(true);

    const result = renameProvider.provideRenameEdits(
      doc,
      pos,
      "newName",
      token,
    );

    expect(result).toBeUndefined();
    expect(provideRenameEditsMock).not.toHaveBeenCalled();
  });

  it("calls prepareRename when not cancelled", () => {
    const doc = makeDocument();
    const pos = makePosition();
    const token = makeToken(false);

    prepareRenameMock.mockReturnValue("prepared");

    const result = renameProvider.prepareRename!(doc, pos, token);

    expect(result).toBe("prepared");
    expect(prepareRenameMock).toHaveBeenCalledWith(pos);
  });

  it("returns undefined when cancelled (prepareRename)", () => {
    const doc = makeDocument();
    const pos = makePosition();
    const token = makeToken(true);

    const result = renameProvider.prepareRename!(doc, pos, token);

    expect(result).toBeUndefined();
    expect(prepareRenameMock).not.toHaveBeenCalled();
  });

  it("returns undefined when document is missing", () => {
    const doc = makeDocument("file:///missing");
    const pos = makePosition();
    const token = makeToken(false);

    const result = renameProvider.prepareRename!(doc, pos, token);

    expect(result).toBeUndefined();
  });
});
