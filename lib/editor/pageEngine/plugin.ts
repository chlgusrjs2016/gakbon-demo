import type { Editor } from "@tiptap/react";
import type { BreakMarker } from "./types";
import { getEditorChildren } from "./measure";

const BREAK_ATTR = "data-page-break-margin";

export function resetPageBreakSpacing(editor: Editor) {
  const children = getEditorChildren(editor);
  for (const el of children) {
    if (el.style.marginTop) {
      el.style.marginTop = "";
    }
    delete el.dataset.pageBreakMargin;
  }
}

export function applyPageBreakSpacing(editor: Editor, breakMarkers: BreakMarker[]) {
  const children = getEditorChildren(editor);
  for (const marker of breakMarkers) {
    const el = children[marker.blockIndex];
    if (!el) continue;
    const baseMarginTop = parseFloat(window.getComputedStyle(el).marginTop) || 0;
    el.style.marginTop = `${baseMarginTop + marker.spacerHeight}px`;
    el.setAttribute(BREAK_ATTR, "true");
  }
}
