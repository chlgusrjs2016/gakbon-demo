import type { JSONContent } from "@tiptap/core";
import { serializeTiptapToHtml } from "./tiptapSerializer";

export function serializeMarkdownToHtml(content: JSONContent): string {
  return serializeTiptapToHtml("md", content);
}

export function buildMarkdownPdfCss(): string {
  return `
.markdown-root {
  color: #111827;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.8;
  letter-spacing: 0.01em;
  word-break: break-word;
}
.markdown-root p { margin: 0 0 0.9rem 0; }
.markdown-root h1 { font-size: 2rem; line-height: 1.3; font-weight: 700; margin: 1.5rem 0 0.75rem; }
.markdown-root h2 { font-size: 1.5rem; line-height: 1.4; font-weight: 700; margin: 1.25rem 0 0.6rem; }
.markdown-root h3 { font-size: 1.2rem; line-height: 1.5; font-weight: 600; margin: 1rem 0 0.5rem; }
.markdown-root ul, .markdown-root ol { margin: 0 0 0.9rem; padding-left: 1.5rem; }
.markdown-root a { color: #2563eb; text-decoration: underline; }
.markdown-root img { display: block; max-width: 100%; height: auto; margin: 1rem auto; page-break-inside: avoid; }
.markdown-root .markdown-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 1rem 0; page-break-inside: avoid; }
.markdown-root .markdown-table td, .markdown-root .markdown-table th {
  border: 1px solid #d4d4d8;
  padding: 0.5rem 0.625rem;
  vertical-align: top;
  background: #fff;
}
.markdown-root .markdown-table th { background: #f4f4f5; font-weight: 600; }
.markdown-root pre {
  border-radius: 10px;
  background: #111827;
  color: #f9fafb;
  padding: 0.875rem 1rem;
  overflow-x: auto;
}
`;
}
