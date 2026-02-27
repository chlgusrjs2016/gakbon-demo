import { randomUUID } from "crypto";
import type { JSONContent } from "@tiptap/core";

export type DocumentVersionMeta = {
  version: number;
  updatedAt: string;
};

export function nextDocumentVersion(current: DocumentVersionMeta | null): DocumentVersionMeta {
  return {
    version: (current?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function collectBlockIdentifiers(doc: JSONContent | null): string[] {
  if (!doc || doc.type !== "doc" || !Array.isArray(doc.content)) return [];
  return doc.content.map((_, index) => `block-${index + 1}`);
}

export function generateMissingBlockIds(
  existing: Array<string | null | undefined>
): string[] {
  return existing.map((id) => id?.trim() || randomUUID());
}

export function validateUniqueBlockIds(ids: string[]): boolean {
  const valid = ids.filter(Boolean);
  return new Set(valid).size === valid.length;
}
