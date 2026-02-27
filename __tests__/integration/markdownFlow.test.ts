import { describe, expect, it } from "vitest";
import { parseMarkdownToJson, serializeJsonToMarkdown } from "@/lib/editor/markdown/serializer";

describe("Integration: Markdown create-edit-save flow", () => {
  it("should parse and serialize saved markdown content", () => {
    const source = "# Doc\n\ncontent";
    const parsed = parseMarkdownToJson(source);
    const saved = JSON.stringify(parsed);
    const restored = JSON.parse(saved);
    const markdown = serializeJsonToMarkdown(restored);

    expect(markdown.includes("# Doc")).toBe(true);
    expect(markdown.includes("content")).toBe(true);
  });

  it("should handle empty markdown document", () => {
    const parsed = parseMarkdownToJson("");
    expect(parsed.type).toBe("doc");
  });

  it("should support large markdown payload without throwing", () => {
    const large = Array.from({ length: 1200 }, (_, i) => `- item ${i + 1}`).join("\n");
    expect(() => parseMarkdownToJson(large)).not.toThrow();
  });
});
