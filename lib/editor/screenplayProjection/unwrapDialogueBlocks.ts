import type { JSONContent } from "@tiptap/core";

function cloneNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === "object" && "type" in (value as object));
}

function collectTextContent(node: JSONContent | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  if (!Array.isArray(node.content)) return "";
  return node.content.map((child) => collectTextContent(child)).join("");
}

function unwrapNode(node: JSONContent): JSONContent[] {
  if (node.type === "dialogueBlock") {
    const children = Array.isArray(node.content) ? node.content.filter(isJsonContent) : [];
    const out: JSONContent[] = [];
    const character = children.find((c) => c.type === "character");
    const speechFlow = children.find((c) => c.type === "speechFlow");
    if (character) out.push(...unwrapNode(character));
    if (speechFlow && Array.isArray(speechFlow.content)) {
      for (const seg of speechFlow.content) {
        if (isJsonContent(seg)) out.push(...unwrapNode(seg));
      }
    }
    return out;
  }

  if (node.type === "speechFlow") {
    const out: JSONContent[] = [];
    for (const child of node.content ?? []) {
      if (isJsonContent(child)) out.push(...unwrapNode(child));
    }
    return out;
  }

  if (!Array.isArray(node.content)) {
    return [cloneNode(node)];
  }

  const cloned = cloneNode(node);
  const clonedChildren = Array.isArray(cloned.content) ? cloned.content : [];
  cloned.content = clonedChildren.flatMap((child) => {
    if (!isJsonContent(child)) return [child];
    if (child.type === "dialogueBlock" || child.type === "speechFlow") {
      return unwrapNode(child);
    }
    return unwrapNode(child);
  });
  return [cloned];
}

export function unwrapDialogueBlocks(content: JSONContent | null | undefined): JSONContent | null {
  if (!content || content.type !== "doc") return content ?? null;
  const out: JSONContent = cloneNode(content);
  const source = Array.isArray(content.content) ? content.content : [];
  out.content = source.flatMap((child) => {
    if (!isJsonContent(child)) return [child];
    return unwrapNode(child);
  });
  if (!Array.isArray(out.content) || out.content.length === 0) {
    out.content = [{ type: "paragraph" }];
  }
  return out;
}

export function textFromJsonNode(node: JSONContent | null | undefined): string {
  return collectTextContent(node).trim();
}
