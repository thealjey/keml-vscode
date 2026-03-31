/**
 * Checks whether a given name represents a log.
 * @param name - The name to check.
 * @returns A boolean indicating if the name represents a log.
 */
export const isLog = (name: string) => name === "log" || name === "x-log";

/* v8 ignore start */
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isLog", () => {
    it("returns true only for 'log' and 'x-log'", () => {
      expect(isLog("log")).toBe(true);
      expect(isLog("x-log")).toBe(true);
      expect(isLog("top")).toBe(false);
    });
  });
}
/* v8 ignore stop */
