import type { Editor } from "@tiptap/core";
import type { CursorPositionKind, LayoutMode, TransitionContext } from "./types";

export type TransitionContextExtras = Partial<TransitionContext> & {
  dialogueBlock?: any | null;
  speechFlow?: any | null;
  segment?: any | null;
  character?: any | null;
  topLevelBlock?: any | null;
};

export function getEditorLayoutMode(editor: Editor): LayoutMode | undefined {
  try {
    const root = editor.view?.dom as HTMLElement | undefined;
    const mode = root?.closest?.(".scenario-editor")?.getAttribute("data-layout-mode") ?? root?.getAttribute?.("data-layout-mode");
    if (mode === "us_dialogue_block" || mode === "kr_dialogue_inline") return mode;
  } catch {
    // ignore mount timing errors
  }
  return undefined;
}

function findAncestor($from: any, name: string) {
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

function findTopLevelBlock($from: any) {
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

function getChildInfo(parentNode: any, parentPos: number, typeName: string): any {
  let found: { node: any; pos: number; index: number } | null = null;
  parentNode.forEach((child: any, offset: number, index: number) => {
    if (!found && child.type.name === typeName) {
      found = { node: child, pos: parentPos + 1 + offset, index };
    }
  });
  return found;
}

export function getRuntimeDialogueBlockContext(state: Editor["state"]): any {
  const { $from } = state.selection as any;
  const dialogueBlock = findAncestor($from, "dialogueBlock");
  if (!dialogueBlock) return null;
  const character = getChildInfo(dialogueBlock.node, dialogueBlock.pos, "character");
  const speechFlow = getChildInfo(dialogueBlock.node, dialogueBlock.pos, "speechFlow");
  const segment =
    $from.parent.type.name === "dialogue" || $from.parent.type.name === "parenthetical"
      ? {
          type: $from.parent.type.name,
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
    topLevelBlock: findTopLevelBlock($from),
  };
}

function getCursorPosition(parentText: string, parentOffset: number): CursorPositionKind {
  if (parentText.length === 0) return "all";
  if (parentOffset <= 0) return "start";
  if (parentOffset >= parentText.length) return "end";
  return "middle";
}

export function buildScreenplayTransitionContext(
  editor: Editor,
  extras: TransitionContextExtras = {},
  opts?: { isComposing?: boolean },
): TransitionContext {
  const state = editor.state;
  const view = editor.view;
  const { $from } = state.selection;
  const derived = getRuntimeDialogueBlockContext(state);
  const parentText = $from.parent.textContent ?? "";
  const parentOffset = $from.parentOffset;

  return {
    editor,
    state,
    view,
    documentType: "screenplay",
    layoutMode: extras.layoutMode ?? getEditorLayoutMode(editor),
    selectionEmpty: state.selection.empty,
    parentType: $from.parent.type.name,
    parentText,
    parentOffset,
    cursorPosition: getCursorPosition(parentText, parentOffset),
    isComposing: Boolean(opts?.isComposing),
    insideDialogueBlock: Boolean(extras.dialogueBlock ?? derived?.dialogueBlock),
    parentEmpty: parentText.length === 0,
    dialogueBlock: extras.dialogueBlock ?? derived?.dialogueBlock ?? null,
    speechFlow: extras.speechFlow ?? derived?.speechFlow ?? null,
    segment: extras.segment ?? derived?.segment ?? null,
    character: extras.character ?? derived?.character ?? null,
    topLevelBlock: extras.topLevelBlock ?? derived?.topLevelBlock ?? null,
  };
}
