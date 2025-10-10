import { ConfigurationChangeEvent } from "vscode";
import { configure } from "./configure.mts";

/**
 * Handles configuration change events for relevant settings.
 *
 * @param e Configuration change event.
 * @returns Result of configuration update or a truthy value if unaffected.
 */
export const onDidChangeConfiguration = (e: ConfigurationChangeEvent) =>
  !e.affectsConfiguration("keml") ||
  !e.affectsConfiguration("search") ||
  extern.configure();

let extern = { configure };

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

  describe("onDidChangeConfiguration", () => {
    afterAll(() => {
      extern = origExtern;
    });

    it("returns true if keml is not affected", () => {
      const e = {
        affectsConfiguration: fn((name: string) => name === "search"),
      };

      const result = onDidChangeConfiguration(e as any);

      expect(result).toBe(true);
    });

    it("returns true if keml is affected but search is not", () => {
      const e = {
        affectsConfiguration: fn((name: string) => name === "keml"),
      };

      const result = onDidChangeConfiguration(e as any);

      expect(result).toBe(true);
    });

    it("calls configure and returns its result if both keml and search are affected", () => {
      const e = {
        affectsConfiguration: fn(() => true),
      };
      extern.configure = fn(() => "configured") as any;

      const result = onDidChangeConfiguration(e as any);

      expect(result).toBe("configured");
      expect(extern.configure).toHaveBeenCalled();
    });
  });
}
/* v8 ignore stop */
