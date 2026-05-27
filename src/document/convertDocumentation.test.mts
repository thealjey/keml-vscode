import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("vscode", () => {
  class MarkdownString {
    public value: string;

    public constructor(value = "") {
      this.value = value;
    }

    public appendCodeblock(code: string, language: string): this {
      this.value = `\`\`\`${language}\n${code}\n\`\`\``;

      return this;
    }
  }

  return {
    MarkdownString,
  };
});

vi.mock("vscode-html-languageservice", () => {
  const MarkupKind = {
    Markdown: "markdown",
    PlainText: "plaintext",
  };

  const MarkupContent = {
    is: (value: unknown): boolean =>
      typeof value === "object" &&
      value !== null &&
      "kind" in value &&
      "value" in value,
  };

  return {
    MarkupKind,
    MarkupContent,
  };
});

import { MarkdownString } from "vscode";
import { MarkupKind } from "vscode-html-languageservice";

import { convertDocumentation } from "./convertDocumentation.mts";

describe("convertDocumentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns strings unchanged", () => {
    const result = convertDocumentation("plain text");

    expect(result).toBe("plain text");
  });

  it("converts markdown markup content into a MarkdownString", () => {
    const documentation = {
      kind: MarkupKind.Markdown,
      value: "# Heading",
    };

    const result = convertDocumentation(documentation);

    expect(result).toBeInstanceOf(MarkdownString);

    expect(result).toEqual({
      value: "# Heading",
    });
  });

  it("returns plaintext markup content values directly", () => {
    const documentation = {
      kind: MarkupKind.PlainText,
      value: "plain content",
    };

    const result = convertDocumentation(documentation);

    expect(result).toBe("plain content");
  });

  it("converts marked strings into MarkdownString code blocks", () => {
    const documentation = {
      language: "ts",
      value: "const x = 1;",
    };

    const result = convertDocumentation(documentation);

    expect(result).toBeInstanceOf(MarkdownString);

    expect(result).toEqual({
      value: "```ts\nconst x = 1;\n```",
    });
  });

  it("converts arrays recursively", () => {
    const documentation = [
      "plain text",
      {
        kind: MarkupKind.Markdown,
        value: "# Title",
      },
      {
        kind: MarkupKind.PlainText,
        value: "plain content",
      },
      {
        language: "js",
        value: "console.log('hi');",
      },
    ];

    const result = convertDocumentation(documentation);

    expect(result).toHaveLength(4);

    expect(result).toEqual([
      "plain text",
      {
        value: "# Title",
      },
      "plain content",
      {
        value: "```js\nconsole.log('hi');\n```",
      },
    ]);
  });
});
