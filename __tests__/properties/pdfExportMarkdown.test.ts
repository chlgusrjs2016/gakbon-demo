import { describe, expect, it } from "vitest";
import { serializeTiptapToHtml } from "@/lib/export/pdf/tiptapSerializer";
import { buildPdfPrintCss } from "@/lib/export/pdf/printCss";

describe("Property 10: PDF Export with Format Preservation", () => {
  it("should render markdown heading/table/code to html", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Hello" }] },
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }] },
              ],
            },
          ],
        },
        { type: "codeBlock", content: [{ type: "text", text: "const x = 1" }] },
      ],
    } as const;

    const html = serializeTiptapToHtml("md", doc as never);
    expect(html.includes("<h1")).toBe(true);
    expect(html.includes("<table")).toBe(true);
    expect(html.includes("<pre")).toBe(true);
  });

  it("should include markdown-root css", () => {
    const css = buildPdfPrintCss(
      "md",
      { pageSize: "a4", margins: { top: 96, bottom: 96, left: 96, right: 96 } },
      ""
    );
    expect(css.includes(".markdown-root")).toBe(true);
  });
});
