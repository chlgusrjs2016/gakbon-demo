/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Editor } from "@tiptap/core";
import {
  createDialogueBlockNode,
  createDialogueBlockNodeFromSegments,
  createTopLevelNode,
} from "../model/builders";
import {
  findPreviousTopLevelBlockByPos,
  findSegmentIndexInSpeechFlow,
  findTopLevelBlock,
  firstSpeechSegmentPos,
  getChildInfo,
  getDialogueBlockContext,
  speechSegmentPosByIndex,
  speechSegmentsFromNode,
} from "../model/selectors";
import {
  cursorPosInTextNode,
  getTextAndCursorOffset,
  setCursor,
} from "../model/selection";
import type { ScreenplayConvertibleNodeType, SpeechKind } from "../types";
import { normalizeDialogueBlocksAroundSelectionInTr } from "./normalizeAroundSelection";

function finalizeConvertTr(state: any, tr: any, dispatch?: (tr: any) => void) {
  normalizeDialogueBlocksAroundSelectionInTr(tr, state.schema);
  dispatch?.(tr.scrollIntoView());
  return true;
}

export function convertScreenplayNodeTypeCommand(params: {
  editor: Editor;
  state: any;
  dispatch?: (tr: any) => void;
  targetType: ScreenplayConvertibleNodeType;
}): boolean {
  const { state, dispatch, targetType } = params;
  const { $from } = state.selection;
  const top = findTopLevelBlock($from);
  if (!top) return false;
  const ctx = getDialogueBlockContext(state);
  const { text: currentText, offset: currentOffset } = getTextAndCursorOffset(state);
  const isRegularTarget =
    targetType === "general" ||
    targetType === "action" ||
    targetType === "sceneHeading" ||
    targetType === "transition";

  if (!ctx) {
    if (targetType === "character") {
      const block = createDialogueBlockNode(state.schema, currentText);
      if (!block) return false;
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, block);
      setCursor(tr, cursorPosInTextNode(top.pos + 1, currentText, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }

    if (targetType === "dialogue" || targetType === "parenthetical") {
      const prevTop: any = findPreviousTopLevelBlockByPos(state, top.pos);
      if (prevTop?.node?.type?.name === "character") {
        const prevCharacterText = prevTop.node.textContent ?? "";
        const merged = createDialogueBlockNode(state.schema, prevCharacterText, targetType, currentText);
        if (!merged) return false;
        const tr = state.tr.replaceWith(prevTop.pos, top.pos + top.node.nodeSize, merged);
        const firstSpeech = firstSpeechSegmentPos(merged, prevTop.pos);
        if (!firstSpeech) return false;
        setCursor(tr, cursorPosInTextNode(firstSpeech.pos, currentText, currentOffset));
        return finalizeConvertTr(state, tr, dispatch);
      }

      if (prevTop?.node?.type?.name === "dialogueBlock") {
        const prevCharacter: any = getChildInfo(prevTop.node, prevTop.pos, "character");
        const prevSpeechFlow: any = getChildInfo(prevTop.node, prevTop.pos, "speechFlow");
        if (prevSpeechFlow) {
          const prevCharacterText = prevCharacter?.node?.textContent ?? "";
          const prevSegments = speechSegmentsFromNode(prevSpeechFlow.node);
          const mergedSegments = [...prevSegments, { type: targetType as SpeechKind, text: currentText }];
          const merged = createDialogueBlockNodeFromSegments(
            state.schema,
            prevCharacterText,
            mergedSegments,
            {
              omitEmptyCharacter: prevCharacterText.length === 0,
            }
          );
          if (!merged) return false;
          const tr = state.tr.replaceWith(prevTop.pos, top.pos + top.node.nodeSize, merged);
          const appendedPos = speechSegmentPosByIndex(merged, prevTop.pos, mergedSegments.length - 1);
          if (!appendedPos) return false;
          setCursor(tr, cursorPosInTextNode(appendedPos.pos, currentText, currentOffset));
          return finalizeConvertTr(state, tr, dispatch);
        }
      }

      const block = createDialogueBlockNode(state.schema, "", targetType, currentText, { omitEmptyCharacter: true });
      if (!block) return false;
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, block);
      const firstSpeech = firstSpeechSegmentPos(block, top.pos);
      if (!firstSpeech) return false;
      setCursor(tr, cursorPosInTextNode(firstSpeech.pos, currentText, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }

    if (isRegularTarget) {
      if (top.node.type.name === targetType) return true;
      const replacement = createTopLevelNode(state.schema, targetType, currentText);
      if (!replacement) return false;
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, replacement);
      setCursor(tr, cursorPosInTextNode(top.pos, currentText, currentOffset));
      dispatch?.(tr.scrollIntoView());
      return true;
    }
    return false;
  }

  const characterText = ctx.character?.node?.textContent ?? "";
  const segments = speechSegmentsFromNode(ctx.speechFlow?.node);

  if (ctx.parentType === "character") {
    if (targetType === "character") return true;

    if (targetType === "dialogue" || targetType === "parenthetical") {
      const nextSegments = [{ type: targetType, text: characterText }, ...segments];
      const block = createDialogueBlockNodeFromSegments(state.schema, "", nextSegments, { omitEmptyCharacter: true });
      if (!block) return false;
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, block);
      const firstSpeech = firstSpeechSegmentPos(block, top.pos);
      if (!firstSpeech) return false;
      setCursor(tr, cursorPosInTextNode(firstSpeech.pos, characterText, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }

    if (isRegularTarget) {
      const extracted = createTopLevelNode(state.schema, targetType, characterText);
      if (!extracted) return false;
      const afterBlock =
        segments.length > 0
          ? createDialogueBlockNodeFromSegments(state.schema, "", segments, { omitEmptyCharacter: true })
          : null;
      const replacement = afterBlock ? [extracted, afterBlock] : [extracted];
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, replacement as any);
      setCursor(tr, cursorPosInTextNode(top.pos, characterText, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }

    return false;
  }

  if ((ctx.parentType === "dialogue" || ctx.parentType === "parenthetical") && ctx.segment) {
    const segmentIndex = findSegmentIndexInSpeechFlow(ctx);
    if (segmentIndex < 0) return false;
    const currentSegment = segments[segmentIndex];
    if (!currentSegment) return false;

    if (targetType === "dialogue" || targetType === "parenthetical") {
      if (currentSegment.type === targetType) return true;
      const nextSegments = segments.map((seg, idx) =>
        idx === segmentIndex ? { ...seg, type: targetType } : seg
      );
      const block = createDialogueBlockNodeFromSegments(state.schema, characterText, nextSegments);
      if (!block) return false;
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, block);
      const speechFlow = getChildInfo(block, top.pos, "speechFlow");
      if (!speechFlow) return false;
      let targetSegPos: number | null = null;
      let idx = 0;
      speechFlow.node.forEach((child: any, offset: number) => {
        if (idx === segmentIndex) targetSegPos = speechFlow.pos + 1 + offset;
        idx += 1;
      });
      if (targetSegPos == null) return false;
      setCursor(tr, cursorPosInTextNode(targetSegPos, currentSegment.text, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }

    if (targetType === "character") {
      const nextSegments = segments.filter((_, idx) => idx !== segmentIndex);
      const nextCharacterText = currentSegment.text;
      const block = createDialogueBlockNodeFromSegments(state.schema, nextCharacterText, nextSegments);
      if (!block) return false;
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, block);
      setCursor(tr, cursorPosInTextNode(top.pos + 1, nextCharacterText, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }

    if (isRegularTarget) {
      const beforeSegments = segments.slice(0, segmentIndex);
      const afterSegments = segments.slice(segmentIndex + 1);
      const beforeBlock =
        beforeSegments.length > 0
          ? createDialogueBlockNodeFromSegments(state.schema, characterText, beforeSegments)
          : null;
      const extracted = createTopLevelNode(state.schema, targetType, currentSegment.text);
      if (!extracted) return false;
      const afterBlock =
        afterSegments.length > 0
          ? createDialogueBlockNodeFromSegments(state.schema, "", afterSegments, { omitEmptyCharacter: true })
          : null;
      const replacement = [
        ...(beforeBlock ? [beforeBlock] : []),
        extracted,
        ...(afterBlock ? [afterBlock] : []),
      ];
      const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, replacement as any);
      const extractedPos = top.pos + (beforeBlock ? beforeBlock.nodeSize : 0);
      setCursor(tr, cursorPosInTextNode(extractedPos, currentSegment.text, currentOffset));
      return finalizeConvertTr(state, tr, dispatch);
    }
  }

  return false;
}
