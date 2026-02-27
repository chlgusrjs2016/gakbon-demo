import { describe, expect, it } from "vitest";
import { parseMarkdownToJson } from "@/lib/editor/markdown/serializer";

describe("Property 13: GFM Syntax Support", () => {
  it("should parse task list", () => {
    const parsed = parseMarkdownToJson("- [x] done");
    expect(parsed.content?.[0]?.type).toBe("taskList");
  });

  it("should parse table", () => {
    const parsed = parseMarkdownToJson("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(parsed.content?.[0]?.type).toBe("table");
  });

  it("should parse fenced code block", () => {
    const parsed = parseMarkdownToJson("```js\nconsole.log(1)\n```");
    expect(parsed.content?.[0]?.type).toBe("codeBlock");
  });
});
