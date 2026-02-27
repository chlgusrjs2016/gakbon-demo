import { describe, expect, it } from "vitest";
import { parseMarkdownToJson } from "@/lib/editor/markdown/serializer";

describe("Property 15: Escape Sequence Handling", () => {
  it("should handle escaped markdown symbols without crashing", () => {
    const parsed = parseMarkdownToJson("\\# not heading\\n\\*not list");
    expect(parsed.type).toBe("doc");
  });
});
