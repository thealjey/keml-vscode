import { capitalize } from "./capitalize.mts";
import { printable } from "./printable.mts";

type LeftOfPipe<T extends string> =
  T extends `${infer Left}|${string}` ? Left : T;

const PLAIN = 0b1;
const CAPS = 0b10;

/**
 * Creates a template formatter that resolves named placeholders from a value
 * map.
 *
 * The returned function substitutes placeholders with values from the provided
 * object and applies any declared formatting modifiers during substitution.
 *
 * Returns a fully resolved string.
 */
export const t = <T extends string>(
  strings: TemplateStringsArray,
  ...placeholders: T[]
) => {
  const pl = placeholders.length;
  const len = strings.length + pl;
  const result = new Array(len);
  const keys = new Array<LeftOfPipe<T>>(pl);
  const masks = new Array<number>(pl);
  let i, j, pair, value, mask;

  for (i = 0, j = 0; i < len; i += 2, ++j) {
    result[i] = strings[j];
  }

  for (i = 0; i < pl; ++i) {
    pair = placeholders[i]!.split("|");
    keys[i] = pair[0] as any;
    masks[i] = parseInt(pair[1] || "0", 2);
  }

  return (values: Record<LeftOfPipe<T>, any>) => {
    for (i = 1, j = 0; i < len; i += 2, ++j) {
      value = values[keys[j]!];
      mask = masks[j]!;
      mask & CAPS && (value = capitalize(value));
      mask & PLAIN || (value = printable(value));
      result[i] = value;
    }

    return result.join("");
  };
};
