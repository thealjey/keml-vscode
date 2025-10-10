import { matchesGlob } from "node:path";

/**
 * Checks whether a path matches a specified glob pattern.
 *
 * @param path Path to test.
 * @param pattern Glob pattern to match.
 * @returns True if the path matches the pattern.
 */
const glob = (path: string, pattern: string) =>
  matchesGlob(path, pattern) ||
  matchesGlob(path, `**/${pattern}`) ||
  matchesGlob(path, `${pattern}/**`) ||
  matchesGlob(path, `**/${pattern}/**`);

/**
 * Determines if a path passes include and exclude pattern checks.
 *
 * @param path Path to evaluate.
 * @param exclude Patterns that disqualify a match.
 * @param include Patterns that can override exclusions.
 * @returns True if the path meets the matching rules.
 */
export const match = (path: string, exclude: string[], include: string[]) => {
  for (let pattern of exclude) {
    if (glob(path, pattern)) {
      for (pattern of include) {
        if (glob(path, pattern)) {
          return true;
        }
      }
      return false;
    }
  }
  return true;
};

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("match", () => {
    it("returns true when no exclude matches", () => {
      expect(match("src/index.ts", ["dist"], [])).toBe(true);
    });

    it("returns false when exclude matches but no include", () => {
      expect(match("dist/index.js", ["dist"], [])).toBe(false);
    });

    it("returns true when exclude matches but include also matches", () => {
      expect(
        match(
          "node_modules/my-lib/index.js",
          ["node_modules/**"],
          ["node_modules/my-lib/**"]
        )
      ).toBe(true);
    });
  });
}
/* v8 ignore stop */
