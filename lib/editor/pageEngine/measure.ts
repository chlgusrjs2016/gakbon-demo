import type { Editor } from "@tiptap/react";
import type { BlockMeasurement, NodeTypeKey } from "./types";
import { buildScreenplayDomGroups } from "./screenplayProjectionDom";

function tryGetEditorDom(editor: Editor): HTMLElement | null {
  try {
    return editor.view.dom as HTMLElement;
  } catch {
    return null;
  }
}

function resolveSemanticRoot(el: HTMLElement): HTMLElement {
  const direct = el.querySelector(
    ":scope > [data-type], :scope > .node-dialogueBlock, :scope > .scene-heading, :scope > .action, :scope > .character, :scope > .dialogue, :scope > .parenthetical, :scope > .transition-block, :scope > p",
  ) as HTMLElement | null;
  return direct ?? el;
}

function detectNodeType(el: HTMLElement): NodeTypeKey {
  const root = resolveSemanticRoot(el);
  if (root.getAttribute("data-type") === "dialogue-block") return "dialogue";
  if (root.classList.contains("node-dialogueBlock")) return "dialogue";
  if (root.classList.contains("scene-heading")) return "sceneHeading";
  if (root.classList.contains("action")) return "action";
  if (root.classList.contains("character")) return "character";
  if (root.classList.contains("dialogue")) return "dialogue";
  if (root.classList.contains("parenthetical")) return "parenthetical";
  if (root.classList.contains("transition-block")) return "transition";
  if (root.tagName === "P") return "paragraph";
  return "unknown";
}

export function getEditorChildren(editor: Editor): HTMLElement[] {
  const editorDom = tryGetEditorDom(editor);
  if (!editorDom) return [];
  return Array.from(editorDom.children) as HTMLElement[];
}

export function measureBlocks(editor: Editor): BlockMeasurement[] {
  const editorDom = tryGetEditorDom(editor);
  if (!editorDom) return [];
  const editorRect = editorDom.getBoundingClientRect();
  const children = getEditorChildren(editor);
  const scenarioRoot = editorDom.closest(".scenario-editor") as HTMLElement | null;
  const layoutMode = scenarioRoot?.dataset.layoutMode;
  const shouldProjectGroups = layoutMode === "kr_dialogue_inline" || layoutMode === "us_dialogue_block";

  if (shouldProjectGroups) {
    const groups = buildScreenplayDomGroups(children);
    return groups.map((group) => {
      const first = group.elements[0];
      const last = group.elements[group.elements.length - 1];
      const firstRect = first.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      const firstStyle = window.getComputedStyle(first);
      const marginTop = parseFloat(firstStyle.marginTop) || 0;
      const top = firstRect.top - editorRect.top;
      const bottom = lastRect.bottom - editorRect.top;
      const text = group.elements.map((el) => (el.textContent ?? "").trim()).filter(Boolean).join(" ");
      const firstType = detectNodeType(first);
      const nodeType: NodeTypeKey =
        group.elements.length > 1 && firstType === "character" ? "dialogue" : firstType;

      return {
        index: group.startIndex,
        nodeType,
        text,
        top,
        height: Math.max(0, bottom - top),
        bottom,
        marginTop,
      };
    });
  }

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
