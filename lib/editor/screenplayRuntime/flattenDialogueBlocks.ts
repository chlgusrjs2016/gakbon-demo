import type { JSONContent } from "@tiptap/core";
import { unwrapDialogueBlocks } from "@/lib/editor/screenplayProjection/unwrapDialogueBlocks";

export function flattenDialogueBlocks(content: JSONContent | null | undefined): JSONContent | null {
  return unwrapDialogueBlocks(content) ?? content ?? null;
}

