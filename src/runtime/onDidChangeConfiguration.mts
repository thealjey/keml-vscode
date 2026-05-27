import type { ConfigurationChangeEvent } from "vscode";
import { configure } from "./configure.mts";

/**
 * Reacts to configuration changes affecting the extension.
 *
 * Reconfigures behavior when either general or search-related settings change.
 */
export const onDidChangeConfiguration = (e: ConfigurationChangeEvent) =>
  (e.affectsConfiguration("keml") || e.affectsConfiguration("search")) &&
  configure(e.affectsConfiguration("keml.warnOnLogAttribute"));
