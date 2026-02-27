import type { JSONContent } from "@tiptap/core";

function mapNodeType(node: JSONContent, fromType: string, toType: string): JSONContent {
  const next: JSONContent = {
    ...node,
    type: node.type === fromType ? toType : node.type,
  };
  if (Array.isArray(node.content)) {
    next.content = node.content.map((child) => {
      if (!child || typeof child !== "object" || !("type" in child)) return child;
      return mapNodeType(child as JSONContent, fromType, toType);
    });
  }
  return next;
}

export function convertScreenplayParagraphToGeneral(content: JSONContent | null | undefined): JSONContent | null {
  if (!content) return null;
  return mapNodeType(content, "paragraph", "general");
}

export function convertScreenplayGeneralToParagraph(content: JSONContent | null | undefined): JSONContent | null {
  if (!content) return null;
  return mapNodeType(content, "general", "paragraph");
}

