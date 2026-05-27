import { extensions } from "vscode";
import { getLanguageExtensions } from "./getLanguageExtensions.mts";

/**
 * Retrieves all file extensions contributed for a given language ID across
 * installed extensions.
 *
 * Extensions are returned in normalized form without leading "." characters.
 */
export const getAllLanguageExtensions = (languageId: string) =>
  extensions.all.flatMap(getLanguageExtensions, languageId);
