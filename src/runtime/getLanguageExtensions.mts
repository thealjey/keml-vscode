import { eq } from "../util/eq.mts";
import { get } from "../util/get.mts";
import { isNotNil } from "../util/isNotNil.mts";
import { trimLeading } from "../util/trimLeading.mts";

/**
 * Extracts file extensions for a language from a VSCode package.json
 * contribution.
 *
 * Returns an array of extensions without leading "." characters.
 */
export function getLanguageExtensions(
  this: string,
  {
    packageJSON,
  }: {
    packageJSON?: {
      contributes?: { languages?: { id: string; extensions?: string[] }[] };
    };
  },
) {
  return (
    packageJSON?.contributes?.languages
      ?.filter(eq, ["id", this])
      .map<string[] | undefined, "extensions">(get, "extensions")
      .filter(isNotNil)
      .flat()
      .map(trimLeading, ".") ?? []
  );
}
