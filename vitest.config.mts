import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ["src/*.mts"],
      reporter: "html",
      all: true,
      clean: true,
      thresholds: { 100: true },
    },
    includeSource: ["src/*.mts"],
  },
  resolve: {
    alias: {
      vscode: resolve(__dirname, "src", "vscode-shim.ts"),
    },
  },
});
