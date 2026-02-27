import type { JSONContent } from "@tiptap/core";
import type {
  DialogueGroupProjection,
  DialogueSpeechSegmentProjection,
  FlatBlockProjection,
  FlatScreenplayNodeType,
  ProjectionNodeRef,
  ScreenplayRenderProjection,
} from "./types";
import { textFromJsonNode } from "./unwrapDialogueBlocks";

const FLAT_TYPES = [
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "general",
  "paragraph",
] as const;

function isFlatType(type: string): type is (typeof FLAT_TYPES)[number] {
  return (FLAT_TYPES as readonly string[]).includes(type);
}

function makeRef(node: JSONContent, nodeIndex: number): ProjectionNodeRef | null {
  if (!node.type || !isFlatType(node.type)) return null;
  return {
    nodeIndex,
    nodeType: node.type === "paragraph" ? "general" : node.type,
    textContent: textFromJsonNode(node),
    node,
  };
}

export function buildScreenplayProjection(content: JSONContent | null | undefined): ScreenplayRenderProjection {
  if (!content || content.type !== "doc" || !Array.isArray(content.content)) return [];

  const refs: ProjectionNodeRef[] = [];
  content.content.forEach((node, idx) => {
    if (!node || typeof node !== "object") return;
    const ref = makeRef(node as JSONContent, idx);
    if (ref) refs.push(ref);
  });

  const result: ScreenplayRenderProjection = [];
  let i = 0;
  while (i < refs.length) {
    const ref = refs[i];
    if (ref.nodeType !== "character") {
      result.push({ kind: "flatBlock", ref } satisfies FlatBlockProjection);
      i += 1;
      continue;
    }

    const speechSegments: DialogueSpeechSegmentProjection[] = [];
    let j = i + 1;
    while (j < refs.length) {
      const next = refs[j];
      if (next.nodeType === "dialogue" || next.nodeType === "parenthetical") {
        speechSegments.push({ kind: next.nodeType, ref: next });
        j += 1;
        continue;
      }
      break;
    }

    result.push({
      kind: "dialogueGroup",
      character: ref,
      speechSegments,
      startNodeIndex: ref.nodeIndex,
      endNodeIndex: (speechSegments.at(-1)?.ref.nodeIndex ?? ref.nodeIndex),
    } satisfies DialogueGroupProjection);
    i = j;
  }

  return result;
}
