/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SpeechKind, SpeechSegment } from "../types";

export function findAncestor($from: any, name: string) {
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);
    if (node?.type?.name === name) {
      return {
        depth,
        node,
        pos: depth > 0 ? $from.before(depth) : 0,
      };
    }
  }
  return null;
}

export function findTopLevelBlock($from: any) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth - 1).type.name === "doc") {
      return {
        depth,
        node: $from.node(depth),
        pos: $from.before(depth),
      };
    }
  }
  return null;
}

export function findPreviousTopLevelBlockByPos(state: any, topPos: number) {
  let prev: { node: any; pos: number; index: number } | null = null;
  state.doc.forEach((child: any, offset: number, index: number) => {
    if (offset >= topPos) return;
    prev = { node: child, pos: offset, index };
  });
  return prev;
}

export function findNextTopLevelBlockByPos(state: any, topPos: number) {
  let found: { node: any; pos: number; index: number } | null = null;
  state.doc.forEach((child: any, offset: number, index: number) => {
    if (found) return;
    if (offset <= topPos) return;
    found = { node: child, pos: offset, index };
  });
  return found;
}

export function getChildInfo(parentNode: any, parentPos: number, typeName: string): any {
  let found: { node: any; pos: number; index: number } | null = null;
  parentNode.forEach((child: any, offset: number, index: number) => {
    if (!found && child.type.name === typeName) {
      found = { node: child, pos: parentPos + 1 + offset, index };
    }
  });
  return found;
}

export function getDialogueBlockContext(state: any): any {
  const { $from } = state.selection;
  const dialogueBlock = findAncestor($from, "dialogueBlock");
  if (!dialogueBlock) return null;
  const character = getChildInfo(dialogueBlock.node, dialogueBlock.pos, "character");
  const speechFlow = getChildInfo(dialogueBlock.node, dialogueBlock.pos, "speechFlow");
  const segment =
    $from.parent.type.name === "dialogue" || $from.parent.type.name === "parenthetical"
      ? {
          type: $from.parent.type.name as SpeechKind,
          node: $from.parent,
          pos: $from.before($from.depth),
          depth: $from.depth,
        }
      : null;
  return {
    dialogueBlock,
    character,
    speechFlow,
    segment,
    parentType: $from.parent.type.name,
    parentOffset: $from.parentOffset,
  };
}

export function speechSegmentsFromNode(speechFlowNode: any): SpeechSegment[] {
  const out: SpeechSegment[] = [];
  if (!speechFlowNode) return out;
  speechFlowNode.forEach((child: any) => {
    if (child?.type?.name === "dialogue" || child?.type?.name === "parenthetical") {
      out.push({
        type: child.type.name as SpeechKind,
        text: child.textContent ?? "",
      });
    }
  });
  return out;
}

export function findSegmentIndexInSpeechFlow(ctx: any): number {
  if (!ctx?.speechFlow || !ctx?.segment) return -1;
  let found = -1;
  let index = 0;
  ctx.speechFlow.node.forEach((child: any, offset: number) => {
    const childPos = ctx.speechFlow.pos + 1 + offset;
    if (childPos === ctx.segment.pos) found = index;
    index += 1;
  });
  return found;
}

export function firstSpeechSegmentPos(dialogueBlockNode: any, dialogueBlockPos: number) {
  const speechFlow = getChildInfo(dialogueBlockNode, dialogueBlockPos, "speechFlow");
  if (!speechFlow || speechFlow.node.childCount === 0) return null;
  const first = speechFlow.node.child(0);
  return {
    pos: speechFlow.pos + 1,
    node: first,
  };
}

export function speechSegmentPosByIndex(
  dialogueBlockNode: any,
  dialogueBlockPos: number,
  targetIndex: number,
) {
  const speechFlow = getChildInfo(dialogueBlockNode, dialogueBlockPos, "speechFlow");
  if (!speechFlow || targetIndex < 0) return null;
  let pos: number | null = null;
  let idx = 0;
  speechFlow.node.forEach((child: any, offset: number) => {
    if (pos != null) return;
    if (idx === targetIndex) {
      pos = speechFlow.pos + 1 + offset;
      return;
    }
    idx += 1;
  });
  if (pos == null) return null;
  return { pos };
}

export function getDialogueBlockParts(node: any, pos: number) {
  if (!node || node.type?.name !== "dialogueBlock") return null;
  const character = getChildInfo(node, pos, "character");
  const speechFlow = getChildInfo(node, pos, "speechFlow");
  if (!speechFlow) return null;
  const characterText = character?.node?.textContent ?? "";
  const segments = speechSegmentsFromNode(speechFlow.node);
  return {
    character,
    speechFlow,
    characterText,
    hasCharacter: Boolean(character),
    hasCharacterText: characterText.trim().length > 0,
    segments,
  };
}

export function getMergeableDialogueParts(node: any, pos: number) {
  if (!node) return null;

  if (node.type?.name === "dialogueBlock") {
    return getDialogueBlockParts(node, pos);
  }

  if (node.type?.name === "character") {
    const characterText = node.textContent ?? "";
    return {
      character: { node, pos, index: 0 },
      speechFlow: null,
      characterText,
      hasCharacter: true,
      hasCharacterText: characterText.trim().length > 0,
      segments: [] as SpeechSegment[],
    };
  }

  if (node.type?.name === "dialogue" || node.type?.name === "parenthetical") {
    const text = node.textContent ?? "";
    return {
      character: null,
      speechFlow: null,
      characterText: "",
      hasCharacter: false,
      hasCharacterText: false,
      segments: [{ type: node.type.name as SpeechKind, text }],
    };
  }

  return null;
}
