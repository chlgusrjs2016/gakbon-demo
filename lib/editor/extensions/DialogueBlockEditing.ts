import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  createDialogueBlockNode,
  createTextNode,
} from "../screenplay/model/builders";
import {
  findAncestor,
  findTopLevelBlock,
  firstSpeechSegmentPos,
  getChildInfo,
  getDialogueBlockContext,
} from "../screenplay/model/selectors";
import {
  cursorPosInTextNode,
  setCursor,
} from "../screenplay/model/selection";
import {
  normalizeDialogueBlocksAroundSelectionCommand as normalizeAroundSelectionCommandImpl,
} from "../screenplay/commands/normalizeAroundSelection";
import {
  convertScreenplayNodeTypeCommand as convertNodeTypeCommandImpl,
} from "../screenplay/commands/convertNodeType";
import type {
  ScreenplayConvertibleNodeType,
  SpeechKind,
} from "../screenplay/types";
import { buildScreenplayTransitionContext } from "../transitions/context";
import { runTransitionForKey } from "../transitions/engine";
import { screenplayTransitionRules } from "../transitions/screenplayPolicy";
import type { TransitionActionRegistry, TransitionKey } from "../transitions/types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    dialogueBlockEditing: {
      insertDialogueBlockFromCharacter: () => ReturnType;
      appendSpeechSegment: (kind: SpeechKind) => ReturnType;
      convertScreenplayNodeType: (kind: ScreenplayConvertibleNodeType) => ReturnType;
      normalizeDialogueBlocksAroundSelection: () => ReturnType;
    };
  }
}

function ensureSpeechFlowHasSegment(state: any, view: any, ctx: any): boolean {
  if (!ctx.speechFlow) return false;
  if (ctx.speechFlow.node.childCount > 0) return true;
  const dialogueNode = createTextNode(state.schema, "dialogue");
  if (!dialogueNode) return false;
  const tr = state.tr.insert(ctx.speechFlow.pos + 1, dialogueNode);
  setCursor(tr, ctx.speechFlow.pos + 2);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function insertDialogueBlockFromCharacterCommand(editor: Editor): boolean {
  const state: any = editor.state;
  const { $from } = state.selection;
  const top = findTopLevelBlock($from);
  if (!top) return false;

  const parentType = $from.parent.type.name;
  const carryText = ["character", "dialogue", "parenthetical"].includes(parentType)
    ? ($from.parent.textContent ?? "")
    : "";
  const node = createDialogueBlockNode(state.schema, carryText, "dialogue", "");
  if (!node) return false;

  const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, node);
  setCursor(tr, top.pos + 2);
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

function appendSpeechSegmentCommand(editor: Editor, kind: SpeechKind): boolean {
  const state: any = editor.state;
  const ctx = getDialogueBlockContext(state);
  if (!ctx?.speechFlow) {
    const node = createDialogueBlockNode(state.schema, "", kind, "", { omitEmptyCharacter: true });
    if (!node) return false;
    const top = findTopLevelBlock(state.selection.$from);
    if (!top) return false;
    const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, node);
    const firstSpeech = firstSpeechSegmentPos(node, top.pos);
    if (!firstSpeech) return false;
    setCursor(tr, firstSpeech.pos + 1);
    editor.view.dispatch(tr.scrollIntoView());
    return true;
  }

  const seg = createTextNode(state.schema, kind);
  if (!seg) return false;
  let insertPos = ctx.speechFlow.pos + 1 + ctx.speechFlow.node.content.size;
  if (ctx.segment) {
    insertPos = ctx.segment.pos + ctx.segment.node.nodeSize;
  }
  const tr = state.tr.insert(insertPos, seg);
  setCursor(tr, insertPos + 1);
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

function handleEnter(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const ctx = getDialogueBlockContext(state);
  if (!ctx) return false;
  const parentText = state.selection.$from.parent.textContent ?? "";
  const isAtEndOfParent = ctx.parentOffset === parentText.length;

  if (ctx.parentType === "character") {
    if (!ctx.speechFlow) return false;
    if (ctx.speechFlow.node.childCount === 0) {
      return ensureSpeechFlowHasSegment(state, view, ctx);
    }
    const firstPos = ctx.speechFlow.pos + 1;
    const tr = state.tr;
    setCursor(tr, firstPos + 1);
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  if (ctx.parentType === "dialogue") {
    // Keep native ProseMirror split behavior when Enter is pressed mid-text.
    // Custom flow only applies when the cursor is at the end of the dialogue.
    if (!isAtEndOfParent) return false;
    const insertPos = ctx.dialogueBlock.pos + ctx.dialogueBlock.node.nodeSize;
    const newBlock = createDialogueBlockNode(state.schema, "", "dialogue", "", { omitEmptyCharacter: true });
    if (!newBlock) return false;
    const tr = state.tr.insert(insertPos, newBlock);
    setCursor(tr, insertPos + 2);
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  if (ctx.parentType === "parenthetical") {
    // Mid-text Enter should split the same node style by default.
    if (!isAtEndOfParent) return false;
    if (!ctx.speechFlow) return false;
    if (ctx.segment) {
      const nextOffset = ctx.segment.pos + ctx.segment.node.nodeSize;
      const resolved = state.doc.resolve(Math.min(nextOffset, state.doc.content.size));
      const nextTop = findTopLevelBlock(resolved);
      if (nextTop && nextTop.node.type.name === "dialogue" && findAncestor(resolved, "speechFlow")?.pos === ctx.speechFlow.pos) {
        const tr = state.tr;
        setCursor(tr, nextTop.pos + 1);
        view.dispatch(tr.scrollIntoView());
        return true;
      }
      const newDialogue = createTextNode(state.schema, "dialogue");
      if (!newDialogue) return false;
      const tr = state.tr.insert(nextOffset, newDialogue);
      setCursor(tr, nextOffset + 1);
      view.dispatch(tr.scrollIntoView());
      return true;
    }
  }

  return false;
}

function splitDialogueToParen(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const ctx = getDialogueBlockContext(state);
  if (!ctx || ctx.parentType !== "dialogue" || !ctx.segment) return false;
  const dialogueType = state.schema.nodes.dialogue;
  const parentheticalType = state.schema.nodes.parenthetical;
  if (!dialogueType || !parentheticalType) return false;

  const text = ctx.segment.node.textContent ?? "";
  const before = text.slice(0, ctx.parentOffset);
  const after = text.slice(ctx.parentOffset);

  const nodes: any[] = [];
  if (before.length > 0) nodes.push(dialogueType.create(null, state.schema.text(before)));
  nodes.push(parentheticalType.create(null, state.schema.text("(")));
  nodes.push(after.length > 0 ? dialogueType.create(null, state.schema.text(after)) : dialogueType.create());

  const tr = state.tr.replaceWith(ctx.segment.pos, ctx.segment.pos + ctx.segment.node.nodeSize, nodes);
  const parentPos = ctx.segment.pos + (before.length > 0 ? nodes[0].nodeSize : 0);
  setCursor(tr, parentPos + 2);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function splitParentheticalToDialogue(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const ctx = getDialogueBlockContext(state);
  if (!ctx || ctx.parentType !== "parenthetical" || !ctx.segment) return false;
  const parentheticalType = state.schema.nodes.parenthetical;
  const dialogueType = state.schema.nodes.dialogue;
  if (!parentheticalType || !dialogueType) return false;

  const text = ctx.segment.node.textContent ?? "";
  const before = text.slice(0, ctx.parentOffset);
  const after = text.slice(ctx.parentOffset);
  const nodes = [
    parentheticalType.create(null, state.schema.text(`${before})`)),
    after.length > 0 ? dialogueType.create(null, state.schema.text(after)) : dialogueType.create(),
  ];
  const tr = state.tr.replaceWith(ctx.segment.pos, ctx.segment.pos + ctx.segment.node.nodeSize, nodes);
  const dialoguePos = ctx.segment.pos + nodes[0].nodeSize;
  setCursor(tr, dialoguePos + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function deleteEmptyDialogueBlockSafelyFromCtx(view: any, ctx: any): boolean {
  const { state } = view;
  if (ctx.parentType === "character") {
    if (state.doc.childCount <= 1) return false;
    const tr = state.tr.delete(
      ctx.dialogueBlock.pos,
      ctx.dialogueBlock.pos + ctx.dialogueBlock.node.nodeSize,
    );
    const targetPos = Math.max(1, Math.min(ctx.dialogueBlock.pos - 1, tr.doc.content.size));
    setCursor(tr, targetPos);
    view.dispatch(tr.scrollIntoView());
    return true;
  }
  return false;
}

function deleteEmptySegmentSafelyFromCtx(view: any, ctx: any): boolean {
  const { state } = view;
  if ((ctx.parentType === "dialogue" || ctx.parentType === "parenthetical") && ctx.segment && ctx.speechFlow) {
    const tr = state.tr.delete(ctx.segment.pos, ctx.segment.pos + ctx.segment.node.nodeSize);
    let targetPos = Math.max(ctx.speechFlow.pos + 1, Math.min(ctx.segment.pos - 1, tr.doc.content.size));
    if (ctx.character) {
      const nextCharacter = getChildInfo(tr.doc.nodeAt(ctx.dialogueBlock.pos), ctx.dialogueBlock.pos, "character");
      if (nextCharacter) {
        const characterText = nextCharacter.node?.textContent ?? "";
        targetPos = cursorPosInTextNode(nextCharacter.pos, characterText, characterText.length);
      } else {
        targetPos = ctx.dialogueBlock.pos + 2;
      }
    }
    setCursor(tr, targetPos);
    view.dispatch(tr.scrollIntoView());
    return true;
  }
  return false;
}

function handleBackspace(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const ctx = getDialogueBlockContext(state);
  if (!ctx) return false;
  if (ctx.parentOffset !== 0) return false;

  const text = state.selection.$from.parent.textContent ?? "";
  if (text.length > 0) return false;

  if (deleteEmptyDialogueBlockSafelyFromCtx(view, ctx)) return true;
  if (deleteEmptySegmentSafelyFromCtx(view, ctx)) return true;
  return false;
}

function focusFirstSpeechSegmentOrCreate(view: any): boolean {
  const { state } = view;
  const ctx = getDialogueBlockContext(state);
  if (!ctx || ctx.parentType !== "character") return false;
  if (!ctx.speechFlow) return false;
  if (ctx.speechFlow.node.childCount === 0) {
    return ensureSpeechFlowHasSegment(state, view, ctx);
  }
  const firstPos = ctx.speechFlow.pos + 1;
  const tr = state.tr;
  setCursor(tr, firstPos + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function insertActionAfterDialogueBlockAndFocus(view: any): boolean {
  const { state } = view;
  const ctx = getDialogueBlockContext(state);
  if (!ctx?.dialogueBlock) return false;
  const actionType = state.schema.nodes.action;
  if (!actionType) return false;

  const insertPos = ctx.dialogueBlock.pos + ctx.dialogueBlock.node.nodeSize;
  const actionNode = actionType.create();
  const tr = state.tr.insert(insertPos, actionNode);
  setCursor(tr, insertPos + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function insertParentheticalPairAtCursor(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const ctx = getDialogueBlockContext(state);
  if (!ctx || ctx.parentType !== "dialogue" || !ctx.segment) return false;
  const dialogueType = state.schema.nodes.dialogue;
  const parentheticalType = state.schema.nodes.parenthetical;
  if (!dialogueType || !parentheticalType) return false;

  const text = ctx.segment.node.textContent ?? "";
  const before = text.slice(0, ctx.parentOffset);
  const after = text.slice(ctx.parentOffset);
  const nodes: any[] = [];
  if (before.length > 0) nodes.push(dialogueType.create(null, state.schema.text(before)));
  nodes.push(parentheticalType.create(null, state.schema.text("()")));
  nodes.push(after.length > 0 ? dialogueType.create(null, state.schema.text(after)) : dialogueType.create());

  const tr = state.tr.replaceWith(ctx.segment.pos, ctx.segment.pos + ctx.segment.node.nodeSize, nodes);
  const parentheticalPos = ctx.segment.pos + (before.length > 0 ? nodes[0].nodeSize : 0);
  setCursor(tr, parentheticalPos + 2);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function moveToOrCreateNextDialogueSegment(view: any): boolean {
  const { state } = view;
  const ctx = getDialogueBlockContext(state);
  if (!ctx?.speechFlow || !ctx?.segment) return false;
  const speechFlowPos = ctx.speechFlow.pos;
  let foundDialoguePos: number | null = null;

  ctx.speechFlow.node.forEach((child: any, offset: number) => {
    const childPos = speechFlowPos + 1 + offset;
    if (childPos <= ctx.segment.pos) return;
    if (foundDialoguePos !== null) return;
    if (child.type.name === "dialogue") foundDialoguePos = childPos;
  });

  if (foundDialoguePos !== null) {
    const tr = state.tr;
    setCursor(tr, foundDialoguePos + 1);
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  const dialogueNode = createTextNode(state.schema, "dialogue");
  if (!dialogueNode) return false;
  const insertPos = ctx.segment.pos + ctx.segment.node.nodeSize;
  const tr = state.tr.insert(insertPos, dialogueNode);
  setCursor(tr, insertPos + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function createTransitionActionRegistry(view: any): TransitionActionRegistry {
  return {
    focusFirstSpeechSegmentOrCreate: () => focusFirstSpeechSegmentOrCreate(view),
    insertActionAfterDialogueBlockAndFocus: () => insertActionAfterDialogueBlockAndFocus(view),
    insertParentheticalPairAtCursor: () => insertParentheticalPairAtCursor(view),
    moveToOrCreateNextDialogueSegment: () => moveToOrCreateNextDialogueSegment(view),
    splitDialogueToParentheticalAtCursor: () => splitDialogueToParen(view),
    splitParentheticalToDialogueAtCursor: () => splitParentheticalToDialogue(view),
    deleteEmptyDialogueBlockSafely: (ctx) => deleteEmptyDialogueBlockSafelyFromCtx(view, ctx),
    deleteEmptySegmentSafely: (ctx) => deleteEmptySegmentSafelyFromCtx(view, ctx),
  };
}

function isLayoutDebugEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("layoutDebug") === "1";
  } catch {
    return false;
  }
}

export const DialogueBlockEditing = Extension.create({
  name: "dialogueBlockEditing",

  addCommands() {
    return {
      // NOTE: `insertDialogueBlockFromCharacter` / `appendSpeechSegment` still dispatch internally
      // via `editor.view.dispatch(...)` and are not chain-safe yet.
      // `convertScreenplayNodeType` / `normalizeDialogueBlocksAroundSelection` below use command
      // props (`state`, `dispatch`) and no longer self-dispatch.
      insertDialogueBlockFromCharacter:
        () =>
        ({ editor }) =>
          insertDialogueBlockFromCharacterCommand(editor),
      appendSpeechSegment:
        (kind) =>
        ({ editor }) =>
          appendSpeechSegmentCommand(editor, kind),
      convertScreenplayNodeType:
        (kind) =>
        ({ editor, state, dispatch }) =>
          convertNodeTypeCommandImpl({
            editor,
            state: state as any,
            dispatch: dispatch as any,
            targetType: kind,
          }),
      normalizeDialogueBlocksAroundSelection:
        () =>
        ({ state, dispatch }) =>
          normalizeAroundSelectionCommandImpl(state as any, dispatch as any),
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    let lastTransitionDebugLog = "";
    return [
      new Plugin({
        key: new PluginKey("dialogueBlockEditing"),
        props: {
          handleKeyDown(view, event) {
            if (event.isComposing) return false;
            const transitionKeyMap: Record<string, TransitionKey> = {
              Enter: "Enter",
              Tab: "Tab",
              Backspace: "Backspace",
              "(": "(",
              ")": ")",
            };
            const transitionKey = transitionKeyMap[event.key];
            if (transitionKey) {
              const state: any = view.state;
              const dialogueCtx = getDialogueBlockContext(state);
              const topLevelBlock = findTopLevelBlock(state.selection.$from);
              const context = buildScreenplayTransitionContext(editor, {
                dialogueBlock: dialogueCtx?.dialogueBlock ?? null,
                speechFlow: dialogueCtx?.speechFlow ?? null,
                segment: dialogueCtx?.segment ?? null,
                character: dialogueCtx?.character ?? null,
                topLevelBlock,
              }, { isComposing: event.isComposing });

              const result = runTransitionForKey({
                key: transitionKey,
                context,
                rules: screenplayTransitionRules,
                registry: createTransitionActionRegistry(view),
              });

              if (result.matched) {
                if (isLayoutDebugEnabled()) {
                  const signature = `${result.ruleId}|${context.parentType}|${transitionKey}|${context.cursorPosition}|${result.outcome}`;
                  if (signature !== lastTransitionDebugLog) {
                    lastTransitionDebugLog = signature;
                    // eslint-disable-next-line no-console
                    console.log("[transitionDebug]", {
                      ruleId: result.ruleId,
                      key: transitionKey,
                      parentType: context.parentType,
                      cursorPosition: context.cursorPosition,
                      outcome: result.outcome,
                    });
                  }
                }
                if (result.consumed || result.outcome !== "allow-default") {
                  event.preventDefault();
                  event.stopPropagation();
                }
                return result.outcome !== "allow-default";
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
