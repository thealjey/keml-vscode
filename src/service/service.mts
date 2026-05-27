import { getLanguageService } from "vscode-html-languageservice";
import { matchLanguageId as isApplicable } from "../document/data.mts";
import { provideAttributes } from "./provideAttributes.mts";
import { getId, provideTags } from "./provider.mts";
import { provideValues } from "./provideValues.mts";

export const service = getLanguageService({
  useDefaultDataProvider: false,
  customDataProviders: [
    { getId, provideTags, isApplicable, provideAttributes, provideValues },
  ],
});
