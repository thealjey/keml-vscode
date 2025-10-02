import { ConfigurationChangeEvent } from "vscode";
import { configure } from "./configure";

/**
 * Handles changes to the workspace configuration.
 *
 * This function is intended to be used as a listener for the
 * {@link ConfigurationChangeEvent}. It triggers a full reconfiguration
 * whenever relevant settings change.
 *
 * @param e - The configuration change event fired by VS Code.
 *
 * @remarks
 * If the change affects either the extension-specific settings or
 * workspace search settings, {@link configure} is called to update
 * internal state and refresh watchers, diagnostics, and providers.
 *
 * @example
 * ```ts
 * import { workspace } from "vscode";
 * import { onDidChangeConfiguration } from "./onDidChangeConfiguration";
 *
 * workspace.onDidChangeConfiguration(onDidChangeConfiguration);
 * ```
 */
export const onDidChangeConfiguration = (e: ConfigurationChangeEvent) =>
  !e.affectsConfiguration("keml") ||
  !e.affectsConfiguration("search") ||
  configure();
