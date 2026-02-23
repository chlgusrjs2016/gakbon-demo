/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextSelection } from "@tiptap/pm/state";

export function setCursor(tr: any, pos: number) {
  const p = Math.max(0, Math.min(pos, tr.doc.content.size));
  tr.setSelection(TextSelection.create(tr.doc, p));
  return tr;
}

export function getTextAndCursorOffset(state: any) {
  const { $from } = state.selection;
  return {
    text: $from.parent.textContent ?? "",
    offset: $from.parentOffset ?? 0,
  };
}

export function cursorPosInTextNode(basePos: number, text: string, offset: number) {
  const clamped = Math.max(0, Math.min(offset, text.length));
  return basePos + 1 + clamped;
}
