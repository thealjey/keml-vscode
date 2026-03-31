import { ConfigurationChangeEvent } from "vscode";
import { configure } from "./configure.mts";

/**
 * Handles configuration change events for relevant settings.
 *
 * @param e Configuration change event.
 * @returns Result of configuration update or a truthy value if unaffected.
 */
export const onDidChangeConfiguration = (e: ConfigurationChangeEvent) =>
  (e.affectsConfiguration("keml") || e.affectsConfiguration("search")) &&
  extern.configure(e.affectsConfiguration("keml.warnOnLogAttribute"));

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

    it("does not call configure if neither keml nor search are affected", () => {
      const e = { affectsConfiguration: fn(() => false) };
      extern.configure = fn();

      const result = onDidChangeConfiguration(e as any);

      expect(extern.configure).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("calls configure if keml is affected", () => {
      const e = { affectsConfiguration: fn((name: string) => name === "keml") };
      extern.configure = fn(() => "configured") as any;

      const result = onDidChangeConfiguration(e as any);

      expect(extern.configure).toHaveBeenCalled();
      expect(result).toBe("configured");
    });

    it("calls configure if search is affected", () => {
      const e = {
        affectsConfiguration: fn((name: string) => name === "search"),
      };
      extern.configure = fn(() => "configured") as any;

      const result = onDidChangeConfiguration(e as any);

      expect(extern.configure).toHaveBeenCalled();
      expect(result).toBe("configured");
    });

    it("calls configure if both keml and search are affected", () => {
      const e = { affectsConfiguration: fn(() => true) };
      extern.configure = fn(() => "configured") as any;

      const result = onDidChangeConfiguration(e as any);

      expect(extern.configure).toHaveBeenCalled();
      expect(result).toBe("configured");
    });
  });
}
/* v8 ignore stop */
