import { describe, expect, it } from "vitest";
import { parseMarkdownToJson } from "@/lib/editor/markdown/serializer";

describe("Property 12: Invalid Markdown Graceful Handling", () => {
  it("should not throw on malformed markdown", () => {
    const malformed = "```\nunterminated\n# [link](\n\n";
    expect(() => parseMarkdownToJson(malformed)).not.toThrow();
  });

  it("should always return a doc root", () => {
    const parsed = parseMarkdownToJson("\u0000\u0001###");
    expect(parsed.type).toBe("doc");
  });
});
