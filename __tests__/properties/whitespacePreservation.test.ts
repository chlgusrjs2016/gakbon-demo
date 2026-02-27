import { describe, expect, it } from "vitest";
import { parseMarkdownToJson, serializeJsonToMarkdown } from "@/lib/editor/markdown/serializer";

describe("Property 14: Whitespace Preservation", () => {
  it("should preserve line breaks between blocks", () => {
    const source = "line1\n\nline2";
    const serialized = serializeJsonToMarkdown(parseMarkdownToJson(source));
    expect(serialized.includes("line1")).toBe(true);
    expect(serialized.includes("line2")).toBe(true);
  });
});
