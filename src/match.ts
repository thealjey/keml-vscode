import { matchesGlob } from "node:path";

/**
 * Tests whether a given file path matches a glob pattern.
 *
 * Unlike a direct call to {@link matchesGlob}, this helper function tries
 * multiple common variations of the provided pattern to account for relative
 * and nested file structures. Specifically, it checks:
 *
 * - The raw pattern as-is (`pattern`)
 * - Any depth before the pattern (`**\/pattern`)
 * - Any depth after the pattern (`pattern/**`)
 * - Any depth before and after the pattern (`**\/pattern/**`)
 *
 * This makes it easier to handle patterns that may or may not include
 * directory prefixes or suffixes.
 *
 * @param path - The file system path to test.
 * @param pattern - The glob pattern to match against.
 *
 * @returns `true` if the path matches any variation of the pattern,
 * otherwise `false`.
 *
 * @example
 * ```ts
 * glob("src/utils/helpers.ts", "*.ts");       // true
 * glob("src/utils/helpers.ts", "utils");      // true
 * glob("src/utils/helpers.ts", "src/**");     // true
 * glob("src/utils/helpers.ts", "dist");       // false
 * ```
 */
const glob = (path: string, pattern: string) =>
  matchesGlob(path, pattern) ||
  matchesGlob(path, `**/${pattern}`) ||
  matchesGlob(path, `${pattern}/**`) ||
  matchesGlob(path, `**/${pattern}/**`);

/**
 * Determines whether a given file path should be considered a match based on a
 * set of exclude and include glob patterns.
 *
 * The logic works as follows:
 * - If the path does **not** match any exclude pattern, it is considered a
 *   match.
 * - If the path matches an exclude pattern, it will only be included if it also
 *   matches at least one include pattern.
 * - If the path matches an exclude pattern and no include patterns, it is
 *   excluded.
 *
 * This allows defining broad exclusion rules with finer-grained overrides.
 *
 * @param path - The file system path to evaluate.
 * @param exclude - An array of glob patterns representing files or directories
 *                  to exclude by default.
 * @param include - An array of glob patterns representing exceptions to the
 *                  exclusions (i.e., files that should still be included).
 *
 * @returns `true` if the path should be included, `false` otherwise.
 *
 * @example
 * ```ts
 * // Exclude everything in "node_modules", but re-include anything under
 * // "node_modules/my-lib"
 * match(
 *   "node_modules/react/index.js",
 *   ["node_modules"],
 *   ["node_modules/my-lib"]
 * ); // false
 * match(
 *   "node_modules/my-lib/index.js",
 *   ["node_modules"],
 *   ["node_modules/my-lib"]
 * ); // true
 *
 * // Exclude "dist" directory, no overrides
 * match("dist/index.js", ["dist"], []); // false
 *
 * // No exclusions
 * match("src/index.ts", [], []); // true
 * ```
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
