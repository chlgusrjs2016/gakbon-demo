/**
 * Phase 2 (방식 A): AI가 내려준 apply_edit 도구 호출을 TipTap 에디터에 반영합니다.
 * search/replace 기준으로 문서에서 검색 후 교체합니다.
 */

import type { Editor } from "@tiptap/react";
import type { ScenarioNodeType } from "@/lib/editor/nodeAnalysis";

type Segment = { startChar: number; endChar: number; startPos: number; endPos: number };

/**
 * 에디터 문서와 동일한 순서로 plain text와 문자 오프셋 → 위치 매핑을 만듭니다.
 * (API에 넘기는 documentContext와 동일한 문자열을 사용해 search가 일치하도록 함)
 */
function buildTextAndSegments(editor: Editor): { text: string; segments: Segment[] } {
  const doc = editor.state.doc;
  const segments: Segment[] = [];
  let text = "";
  let lastWasBlock = false;

  doc.descendants((node, pos) => {
    if (node.isText && node.text != null) {
      if (lastWasBlock) text += "\n";
      const startChar = text.length;
      text += node.text;
      segments.push({
        startChar,
        endChar: text.length,
        // ProseMirror descendants의 text node pos는 첫 글자 위치입니다.
        // +1을 하면 첫 글자를 건너뛰는 오프바이원 버그가 발생합니다.
        startPos: pos,
        endPos: pos + node.nodeSize,
      });
      lastWasBlock = false;
    } else if (node.isBlock) {
      lastWasBlock = true;
    }
  });

  return { text, segments };
}

function findSegment(segments: Segment[], charOffset: number): Segment | undefined {
  return segments.find((s) => charOffset >= s.startChar && charOffset < s.endChar);
}

/**
 * 문자 오프셋 [startChar, endChar)를 ProseMirror 위치 [fromPos, toPos]로 변환합니다.
 */
function charRangeToPos(
  segments: Segment[],
  startChar: number,
  endChar: number
): { fromPos: number; toPos: number } | null {
  const startSeg = findSegment(segments, startChar);
  const endSeg = findSegment(segments, endChar - 1); // endChar-1: 마지막 문자 포함 세그먼트
  if (!startSeg || !endSeg) return null;

  const fromPos = startSeg.startPos + (startChar - startSeg.startChar);
  const toPos = endSeg.startPos + (endChar - endSeg.startChar);
  return { fromPos, toPos };
}

/**
 * 문서에서 search 문자열을 찾아 replace로 바꿉니다.
 * @returns 적용 여부 (search를 찾지 못하면 false)
 */
export function applyFindReplace(editor: Editor, search: string, replace: string): boolean {
  if (!search) return false;

  const { text, segments } = buildTextAndSegments(editor);
  const startChar = text.indexOf(search);
  if (startChar === -1) return false;

  const endChar = startChar + search.length;
  const pos = charRangeToPos(segments, startChar, endChar);
  if (!pos) return false;

  const { fromPos, toPos } = pos;
  editor
    .chain()
    .focus()
    .deleteRange({ from: fromPos, to: toPos })
    .insertContentAt(fromPos, replace)
    .run();

  return true;
}

/**
 * 특정 블록(노드) 내부에서만 search를 찾아 replace로 교체합니다.
 * 블록 타입은 유지되고 텍스트 콘텐츠만 교체됩니다.
 */
export function applyFindReplaceInBlock(
  editor: Editor,
  blockIndex: number,
  search: string,
  replace: string
): boolean {
  if (!search || blockIndex < 1) return false;

  let targetPos: number | null = null;
  let targetNodeSize = 0;
  let targetText = "";
  editor.state.doc.forEach((node, pos, index) => {
    if (targetPos != null) return;
    if (node.isBlock && index + 1 === blockIndex) {
      targetPos = pos;
      targetNodeSize = node.nodeSize;
      targetText = node.textContent ?? "";
    }
  });

  if (targetPos == null) return false;
  if (!targetText.includes(search)) return false;

  const nextText = targetText.replace(search, replace);
  if (nextText === targetText) return false;

  const from = targetPos + 1;
  const to = targetPos + targetNodeSize - 1;

  editor.chain().focus().insertContentAt({ from, to }, nextText).run();
  return true;
}

function getBlockByIndex(editor: Editor, blockIndex: number): { pos: number; nodeSize: number; type: string } | null {
  if (blockIndex < 1) return null;
  let result: { pos: number; nodeSize: number; type: string } | null = null;
  editor.state.doc.forEach((node, pos, index) => {
    if (result != null) return;
    if (node.isBlock && index + 1 === blockIndex) {
      result = { pos, nodeSize: node.nodeSize, type: node.type.name };
    }
  });
  return result;
}

function toInsertNode(type: string, text: string): { type: string; content?: Array<{ type: string; text: string }> } {
  const allowed: ScenarioNodeType[] = [
    "sceneHeading",
    "action",
    "character",
    "dialogue",
    "parenthetical",
    "transition",
    "paragraph",
  ];
  const safeType = allowed.includes(type as ScenarioNodeType) ? type : "paragraph";
  const trimmed = text ?? "";
  return trimmed
    ? { type: safeType, content: [{ type: "text", text: trimmed }] }
    : { type: safeType };
}

export function insertBlockAtNode(
  editor: Editor,
  anchorBlockIndex: number,
  position: "before" | "after",
  nodeType: string,
  text: string
): boolean {
  const anchor = getBlockByIndex(editor, anchorBlockIndex);
  if (!anchor) return false;

  const insertPos = position === "before" ? anchor.pos : anchor.pos + anchor.nodeSize;
  editor.chain().focus().insertContentAt(insertPos, toInsertNode(nodeType, text)).run();
  return true;
}

export function deleteBlockAtNode(
  editor: Editor,
  blockIndex: number,
  options?: { scope?: "node_only" | "dialogue_group" }
): boolean {
  const anchor = getBlockByIndex(editor, blockIndex);
  if (!anchor) return false;

  let from = anchor.pos;
  let to = anchor.pos + anchor.nodeSize;
  const scope = options?.scope ?? "node_only";

  if (scope === "dialogue_group" && anchor.type === "dialogue") {
    const prev = getBlockByIndex(editor, blockIndex - 1);
    const prev2 = getBlockByIndex(editor, blockIndex - 2);
    const next = getBlockByIndex(editor, blockIndex + 1);

    if (prev?.type === "parenthetical") {
      from = prev.pos;
      if (prev2?.type === "character") from = prev2.pos;
    } else if (prev?.type === "character") {
      from = prev.pos;
    }

    if (next?.type === "parenthetical") {
      to = next.pos + next.nodeSize;
    }
  }

  editor.chain().focus().deleteRange({ from, to }).run();
  return true;
}
