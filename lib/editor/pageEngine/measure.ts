import type { Editor } from "@tiptap/react";
import type { BlockMeasurement, NodeTypeKey } from "./types";

function detectNodeType(el: HTMLElement): NodeTypeKey {
  if (el.classList.contains("scene-heading")) return "sceneHeading";
  if (el.classList.contains("action")) return "action";
  if (el.classList.contains("character")) return "character";
  if (el.classList.contains("dialogue")) return "dialogue";
  if (el.classList.contains("parenthetical")) return "parenthetical";
  if (el.classList.contains("transition-block")) return "transition";
  if (el.tagName === "P") return "paragraph";
  return "unknown";
}

export function getEditorChildren(editor: Editor): HTMLElement[] {
  const editorDom = editor.view.dom as HTMLElement;
  return Array.from(editorDom.children) as HTMLElement[];
}

export function measureBlocks(editor: Editor): BlockMeasurement[] {
  const editorDom = editor.view.dom as HTMLElement;
  const editorRect = editorDom.getBoundingClientRect();
  const children = getEditorChildren(editor);

  return children.map((el, index) => {
    const style = window.getComputedStyle(el);
    const marginTop = parseFloat(style.marginTop) || 0;
    const rect = el.getBoundingClientRect();
    const top = rect.top - editorRect.top;
    const height = rect.height;
    return {
      index,
      nodeType: detectNodeType(el),
      text: (el.textContent ?? "").trim(),
      top,
      height,
      bottom: top + height,
      marginTop,
    };
  });
}
