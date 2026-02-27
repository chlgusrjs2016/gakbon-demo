import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { scenarioExtensions } from "@/lib/editor/scenarioKit";
import { documentExtensions } from "@/lib/editor/documentKit";
import { markdownExtensions } from "@/lib/editor/markdownKit";

const screenplayExtensions = [
  StarterKit.configure({
    blockquote: false,
    bold: false,
    codeBlock: false,
    horizontalRule: false,
    heading: { levels: [1, 2, 3] },
    italic: false,
  }),
  ...scenarioExtensions,
];

export function serializeTiptapToHtml(
  documentType: "screenplay" | "document" | "md",
  content: JSONContent
) {
  if (!content || content.type !== "doc") {
    return "<p></p>";
  }

  if (documentType === "screenplay") {
    return generateHTML(content, screenplayExtensions);
  }
  if (documentType === "md") {
    return generateHTML(content, markdownExtensions);
  }
  return generateHTML(content, documentExtensions);
}
