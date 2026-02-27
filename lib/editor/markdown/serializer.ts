import type { JSONContent } from "@tiptap/core";

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function paragraph(text: string): JSONContent {
  if (!text.trim()) return { type: "paragraph" };
  return { type: "paragraph", content: parseInline(text) };
}

function textNode(text: string, marks?: Array<{ type: string; attrs?: Record<string, unknown> }>): JSONContent {
  if (!text) return { type: "text", text: "" };
  return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

function parseInline(input: string): JSONContent[] {
  const result: JSONContent[] = [];
  const tokens = input.match(/(\*\*[^*]+\*\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^\)]+\))/g);
  if (!tokens) return [textNode(input)];

  let cursor = 0;
  for (const token of tokens) {
    const start = input.indexOf(token, cursor);
    if (start > cursor) {
      result.push(textNode(input.slice(cursor, start)));
    }

    if (token.startsWith("**") && token.endsWith("**")) {
      result.push(textNode(token.slice(2, -2), [{ type: "bold" }]));
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      result.push(textNode(token.slice(2, -2), [{ type: "strike" }]));
    } else if (token.startsWith("`") && token.endsWith("`")) {
      result.push(textNode(token.slice(1, -1), [{ type: "code" }]));
    } else if (token.startsWith("[") && token.includes("](")) {
      const split = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (split) {
        result.push(textNode(split[1], [{ type: "link", attrs: { href: split[2] } }]));
      } else {
        result.push(textNode(token));
      }
    } else {
      result.push(textNode(token));
    }

    cursor = start + token.length;
  }

  if (cursor < input.length) {
    result.push(textNode(input.slice(cursor)));
  }

  return result.length > 0 ? result : [textNode(input)];
}

function serializeInline(nodes?: JSONContent[]): string {
  if (!nodes || nodes.length === 0) return "";
  return nodes
    .map((node) => {
      const text = node.text ?? "";
      const marks = node.marks ?? [];
      const link = marks.find((mark) => mark.type === "link");
      if (link && link.attrs?.href) return `[${text}](${String(link.attrs.href)})`;
      if (marks.some((mark) => mark.type === "bold")) return `**${text}**`;
      if (marks.some((mark) => mark.type === "strike")) return `~~${text}~~`;
      if (marks.some((mark) => mark.type === "code")) return `\`${text}\``;
      return text;
    })
    .join("");
}

function normalizeDocument(doc: JSONContent): JSONContent {
  if (doc.type !== "doc") return EMPTY_DOC;
  if (!Array.isArray(doc.content) || doc.content.length === 0) {
    return EMPTY_DOC;
  }
  return doc;
}

export function parseMarkdownToJson(markdown: string): JSONContent {
  try {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const content: JSONContent[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i += 1;
        continue;
      }

      if (/^```/.test(trimmed)) {
        const language = trimmed.replace(/^```/, "").trim() || null;
        const codeLines: string[] = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        content.push({
          type: "codeBlock",
          attrs: language ? { language } : undefined,
          content: [{ type: "text", text: codeLines.join("\n") }],
        });
        continue;
      }

      if (/^---$/.test(trimmed)) {
        content.push({ type: "horizontalRule" });
        i += 1;
        continue;
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        content.push({
          type: "heading",
          attrs: { level: heading[1].length },
          content: parseInline(heading[2]),
        });
        i += 1;
        continue;
      }

      if (/^>\s+/.test(trimmed)) {
        content.push({
          type: "blockquote",
          content: [paragraph(trimmed.replace(/^>\s+/, ""))],
        });
        i += 1;
        continue;
      }

      if (/^\|.+\|$/.test(trimmed) && i + 1 < lines.length && /^\|?[-:| ]+\|?$/.test(lines[i + 1].trim())) {
        const rows: string[][] = [];
        const headerCells = trimmed
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
        rows.push(headerCells);
        i += 2;
        while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
          rows.push(
            lines[i]
              .trim()
              .replace(/^\|/, "")
              .replace(/\|$/, "")
              .split("|")
              .map((cell) => cell.trim())
          );
          i += 1;
        }

        content.push({
          type: "table",
          content: rows.map((row, rowIndex) => ({
            type: "tableRow",
            content: row.map((cell) => ({
              type: rowIndex === 0 ? "tableHeader" : "tableCell",
              content: [paragraph(cell)],
            })),
          })),
        });
        continue;
      }

      if (/^[-*]\s+\[\s\]\s+/.test(trimmed) || /^[-*]\s+\[[xX]\]\s+/.test(trimmed)) {
        const checked = /^[-*]\s+\[[xX]\]\s+/.test(trimmed);
        content.push({
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked },
              content: [paragraph(trimmed.replace(/^[-*]\s+\[[xX\s]\]\s+/, ""))],
            },
          ],
        });
        i += 1;
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        content.push({
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [paragraph(trimmed.replace(/^\d+\.\s+/, ""))],
            },
          ],
        });
        i += 1;
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        content.push({
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [paragraph(trimmed.replace(/^[-*]\s+/, ""))],
            },
          ],
        });
        i += 1;
        continue;
      }

      content.push(paragraph(line));
      i += 1;
    }

    return normalizeDocument({ type: "doc", content });
  } catch {
    return EMPTY_DOC;
  }
}

export function serializeJsonToMarkdown(doc: JSONContent): string {
  const safeDoc = normalizeDocument(doc);
  const lines: string[] = [];

  for (const node of safeDoc.content ?? []) {
    if (node.type === "paragraph") {
      lines.push(serializeInline(node.content));
      continue;
    }

    if (node.type === "heading") {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.level || 1)));
      lines.push(`${"#".repeat(level)} ${serializeInline(node.content)}`);
      continue;
    }

    if (node.type === "blockquote") {
      const first = node.content?.[0];
      lines.push(`> ${serializeInline(first?.content)}`);
      continue;
    }

    if (node.type === "bulletList") {
      const firstItem = node.content?.[0];
      const firstParagraph = firstItem?.content?.[0];
      lines.push(`- ${serializeInline(firstParagraph?.content)}`);
      continue;
    }

    if (node.type === "orderedList") {
      const firstItem = node.content?.[0];
      const firstParagraph = firstItem?.content?.[0];
      lines.push(`1. ${serializeInline(firstParagraph?.content)}`);
      continue;
    }

    if (node.type === "taskList") {
      const firstItem = node.content?.[0];
      const checked = firstItem?.attrs?.checked ? "x" : " ";
      const firstParagraph = firstItem?.content?.[0];
      lines.push(`- [${checked}] ${serializeInline(firstParagraph?.content)}`);
      continue;
    }

    if (node.type === "codeBlock") {
      const language = typeof node.attrs?.language === "string" ? node.attrs.language : "";
      const text = node.content?.[0]?.text ?? "";
      lines.push(`\`\`\`${language}`);
      lines.push(text);
      lines.push("```");
      continue;
    }

    if (node.type === "horizontalRule") {
      lines.push("---");
      continue;
    }

    if (node.type === "table") {
      const rows = node.content ?? [];
      if (rows.length > 0) {
        const header = rows[0];
        const headerCells = (header.content ?? []).map((cell) => serializeInline(cell.content?.[0]?.content));
        lines.push(`| ${headerCells.join(" | ")} |`);
        lines.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
        for (const row of rows.slice(1)) {
          const rowCells = (row.content ?? []).map((cell) => serializeInline(cell.content?.[0]?.content));
          lines.push(`| ${rowCells.join(" | ")} |`);
        }
      }
    }
  }

  const rendered = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return rendered.length > 0 ? rendered : "";
}

export function validateMarkdownRoundTrip(markdown: string): { ok: boolean; reason?: string } {
  try {
    const parsed = parseMarkdownToJson(markdown);
    const serialized = serializeJsonToMarkdown(parsed);
    const reparsed = parseMarkdownToJson(serialized);
    const stable = JSON.stringify(parsed) === JSON.stringify(reparsed);
    return stable ? { ok: true } : { ok: false, reason: "Round-trip structure mismatch" };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Unexpected round-trip error",
    };
  }
}

export const markdownSerializer = {
  parseMarkdownToJson,
  serializeJsonToMarkdown,
  validateMarkdownRoundTrip,
};
