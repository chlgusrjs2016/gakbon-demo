/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  findNextTopLevelBlockByPos,
  findPreviousTopLevelBlockByPos,
  findTopLevelBlock,
  firstSpeechSegmentPos,
  getMergeableDialogueParts,
} from "../model/selectors";
import { createDialogueBlockNodeFromSegments } from "../model/builders";
import { setCursor } from "../model/selection";

export function normalizeDialogueBlocksAroundSelectionInTr(tr: any, schema: any): boolean {
  let mergedAny = false;

  while (true) {
    const workingState = {
      doc: tr.doc,
      selection: tr.selection,
      schema,
    };
    const top = findTopLevelBlock(workingState.selection.$from);
    if (!top) return mergedAny;

    const currentTop = { node: top.node, pos: top.pos };
    const prevTop = findPreviousTopLevelBlockByPos(workingState, top.pos);
    const nextTop = findNextTopLevelBlockByPos(workingState, top.pos);
    const pairs: Array<{ left: { node: any; pos: number }; right: { node: any; pos: number } }> = [];
    if (prevTop) pairs.push({ left: { node: prevTop.node, pos: prevTop.pos }, right: currentTop });
    if (nextTop) pairs.push({ left: currentTop, right: { node: nextTop.node, pos: nextTop.pos } });

    let mergedThisPass = false;
    for (const pair of pairs) {
      const leftParts = getMergeableDialogueParts(pair.left.node, pair.left.pos);
      const rightParts = getMergeableDialogueParts(pair.right.node, pair.right.pos);
      if (!leftParts || !rightParts) continue;

      const leftIsCharacterOnly = leftParts.hasCharacterText && leftParts.segments.length === 0;
      const rightIsSpeechOnly = !rightParts.hasCharacterText && rightParts.segments.length > 0;
      if (!leftIsCharacterOnly || !rightIsSpeechOnly) continue;

      const merged = createDialogueBlockNodeFromSegments(
        schema,
        leftParts.characterText,
        rightParts.segments
      );
      if (!merged) return mergedAny;

      tr.replaceWith(pair.left.pos, pair.right.pos + pair.right.node.nodeSize, merged);
      const firstSpeech = firstSpeechSegmentPos(merged, pair.left.pos);
      if (firstSpeech) {
        setCursor(
          tr,
          Math.max(
            firstSpeech.pos + 1,
            Math.min(tr.mapping.map(workingState.selection.from), tr.doc.content.size)
          )
        );
      }
      mergedAny = true;
      mergedThisPass = true;
      break;
    }

    if (!mergedThisPass) return mergedAny;
  }
}

export function normalizeDialogueBlocksAroundSelectionCommand(
  state: any,
  dispatch?: (tr: any) => void,
): boolean {
  const tr = state.tr;
  const changed = normalizeDialogueBlocksAroundSelectionInTr(tr, state.schema);
  if (!changed) return false;
  dispatch?.(tr.scrollIntoView());
  return true;
}

