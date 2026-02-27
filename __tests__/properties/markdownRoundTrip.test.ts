import { describe, expect, it } from "vitest";
import {
  parseMarkdownToJson,
  serializeJsonToMarkdown,
  validateMarkdownRoundTrip,
} from "@/lib/editor/markdown/serializer";

describe("Property 11: Markdown Round-Trip Preservation", () => {
  it("should preserve structure on parse->serialize->parse", () => {
    const source = "# Title\n\n- item\n\n```ts\nconst a = 1\n```";
    const parsed = parseMarkdownToJson(source);
    const serialized = serializeJsonToMarkdown(parsed);
    const reparsed = parseMarkdownToJson(serialized);

    expect(reparsed.type).toBe("doc");
    expect(JSON.stringify(reparsed)).toBe(JSON.stringify(parseMarkdownToJson(serialized)));
  });

  it("should return ok=true for valid round-trip", () => {
    const result = validateMarkdownRoundTrip("## hello\n\n- [x] done");
    expect(result.ok).toBe(true);
  });
});
