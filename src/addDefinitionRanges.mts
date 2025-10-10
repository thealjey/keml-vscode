import { Range } from "vscode";
import { addRange } from "./addRange.mts";
import { parseTokens } from "./parseTokens.mts";

/**
 * Adds ranges for each token in a given value to the provided store.
 *
 * @param store - Map storing ranges for each token.
 * @param value - String value to parse into tokens.
 * @param range - Base range used to compute token-specific ranges.
 */
export const addDefinitionRanges = (
  store: Map<string, Range[]>,
  value: string,
  range: Range
) => {
  for (const { token, characterDelta } of extern.parseTokens(value)) {
    extern.addRange(
      store,
      token,
      range.with({
        start: range.start.translate({ characterDelta }),
        end: range.start.translate({
          characterDelta: characterDelta + token.length,
        }),
      })
    );
  }
};

let extern = { addRange, parseTokens };

/* v8 ignore start */
if (import.meta.vitest) {
  const {
    describe,
    it,
    expect,
    afterAll,
    vi: { fn },
  } = import.meta.vitest;
  const origExtern = extern;

  extern = {} as typeof extern;

  describe("addDefinitionRanges", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("adds ranges for each parsed token", () => {
      const store = new Map<string, any[]>();
      const mockRange = {
        start: {
          translate: fn().mockImplementation(({ characterDelta }) => ({
            pos: characterDelta,
          })),
        },
        with: fn().mockImplementation(({ start, end }) => ({ start, end })),
      } as any;

      extern.parseTokens = fn().mockReturnValue([
        { token: "abc", characterDelta: 1 },
        { token: "xyz", characterDelta: 5 },
      ]);
      extern.addRange = fn();

      addDefinitionRanges(store, "some text", mockRange);

      expect(extern.addRange).toHaveBeenCalledTimes(2);
      expect(extern.addRange).toHaveBeenCalledWith(
        store,
        "abc",
        expect.objectContaining({
          start: { pos: 1 },
          end: { pos: 4 },
        })
      );
      expect(extern.addRange).toHaveBeenCalledWith(
        store,
        "xyz",
        expect.objectContaining({
          start: { pos: 5 },
          end: { pos: 8 },
        })
      );
    });

    it("does nothing when parseTokens returns empty", () => {
      const store = new Map<string, any[]>();
      const mockRange = { start: { translate: fn() }, with: fn() } as any;

      extern.parseTokens = fn().mockReturnValue([]);
      extern.addRange = fn();

      addDefinitionRanges(store, "no tokens", mockRange);
      expect(extern.addRange).not.toHaveBeenCalled();
    });
  });
}
/* v8 ignore stop */
