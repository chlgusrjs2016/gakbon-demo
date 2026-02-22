import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    screenplayFlowEditing: {
      normalizeScreenplayFlowAroundSelection: () => ReturnType;
    };
  }
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

function setCursor(tr: any, pos: number) {
  const p = Math.max(0, Math.min(pos, tr.doc.content.size));
  tr.setSelection(TextSelection.create(tr.doc, p));
  return tr;
}

function createEmptyBlock(state: any, typeName: "character" | "dialogue" | "parenthetical") {
  const type = state.schema.nodes[typeName];
  return type ? type.create() : null;
}

function handleEnter(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const { $from } = state.selection;
  const parentType = $from.parent.type.name;
  if (!["character", "dialogue", "parenthetical"].includes(parentType)) return false;
  const top = findTopLevelBlock($from);
  if (!top) return false;

  if (parentType === "character") {
    const nextPos = top.pos + top.node.nodeSize;
    const resolved = state.doc.resolve(Math.min(nextPos, state.doc.content.size));
    const next = findTopLevelBlock(resolved);
    if (next && ["dialogue", "parenthetical"].includes(next.node.type.name)) {
      const tr = state.tr;
      setCursor(tr, next.pos + 1);
      view.dispatch(tr.scrollIntoView());
      return true;
    }
    const newDialogue = createEmptyBlock(state, "dialogue");
    if (!newDialogue) return false;
    const tr = state.tr.insert(nextPos, newDialogue);
    setCursor(tr, nextPos + 1);
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  if (parentType === "dialogue") {
    const insertPos = top.pos + top.node.nodeSize;
    const resolved = state.doc.resolve(Math.min(insertPos, state.doc.content.size));
    const next = findTopLevelBlock(resolved);
    if (next && next.node.type.name === "character") {
      const tr = state.tr;
      setCursor(tr, next.pos + 1);
      view.dispatch(tr.scrollIntoView());
      return true;
    }
    const newCharacter = createEmptyBlock(state, "character");
    if (!newCharacter) return false;
    const tr = state.tr.insert(insertPos, newCharacter);
    setCursor(tr, insertPos + 1);
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  if (parentType === "parenthetical") {
    const insertPos = top.pos + top.node.nodeSize;
    const resolved = state.doc.resolve(Math.min(insertPos, state.doc.content.size));
    const next = findTopLevelBlock(resolved);
    if (next && next.node.type.name === "dialogue") {
      const tr = state.tr;
      setCursor(tr, next.pos + 1);
      view.dispatch(tr.scrollIntoView());
      return true;
    }
    const newDialogue = createEmptyBlock(state, "dialogue");
    if (!newDialogue) return false;
    const tr = state.tr.insert(insertPos, newDialogue);
    setCursor(tr, insertPos + 1);
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  return false;
}

function splitFlatNodeToParen(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const { $from } = state.selection;
  if ($from.parent.type.name !== "dialogue") return false;
  const top = findTopLevelBlock($from);
  if (!top) return false;
  const dialogueType = state.schema.nodes.dialogue;
  const parentheticalType = state.schema.nodes.parenthetical;
  if (!dialogueType || !parentheticalType) return false;

  const text = top.node.textContent ?? "";
  const offset = $from.parentOffset;
  const before = text.slice(0, offset);
  const after = text.slice(offset);
  const nodes = [];
  if (before.length > 0) nodes.push(dialogueType.create(null, state.schema.text(before)));
  nodes.push(parentheticalType.create(null, state.schema.text("(")));
  nodes.push(after.length > 0 ? dialogueType.create(null, state.schema.text(after)) : dialogueType.create());

  const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, nodes);
  const parentPos = top.pos + (nodes.length === 3 ? nodes[0].nodeSize : 0);
  setCursor(tr, parentPos + 2);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function splitParentheticalToDialogue(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const { $from } = state.selection;
  if ($from.parent.type.name !== "parenthetical") return false;
  const top = findTopLevelBlock($from);
  if (!top) return false;
  const parentheticalType = state.schema.nodes.parenthetical;
  const dialogueType = state.schema.nodes.dialogue;
  if (!parentheticalType || !dialogueType) return false;

  const text = top.node.textContent ?? "";
  const offset = $from.parentOffset;
  const before = text.slice(0, offset);
  const after = text.slice(offset);
  const nodes = [
    parentheticalType.create(null, state.schema.text(`${before})`)),
    after.length > 0 ? dialogueType.create(null, state.schema.text(after)) : dialogueType.create(),
  ];
  const tr = state.tr.replaceWith(top.pos, top.pos + top.node.nodeSize, nodes);
  const newDialoguePos = top.pos + nodes[0].nodeSize;
  setCursor(tr, newDialoguePos + 1);
  view.dispatch(tr.scrollIntoView());
  return true;
}

function handleBackspace(view: any): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  const { $from } = state.selection;
  const type = $from.parent.type.name;
  if (!["character", "dialogue", "parenthetical"].includes(type)) return false;
  if ($from.parentOffset !== 0) return false;
  if ((($from.parent.textContent ?? "").length) > 0) return false;

  const top = findTopLevelBlock($from);
  if (!top) return false;
  if (state.doc.childCount <= 1) return false;

  const tr = state.tr.delete(top.pos, top.pos + top.node.nodeSize);
  let targetPos = 1;
  if (top.pos > 0) {
    targetPos = Math.max(1, Math.min(top.pos - 1, tr.doc.content.size));
  } else {
    targetPos = 1;
  }
  setCursor(tr, targetPos);
  view.dispatch(tr.scrollIntoView());
  return true;
}

export const ScreenplayFlowEditing = Extension.create({
  name: "screenplayFlowEditing",

  addCommands() {
    return {
      normalizeScreenplayFlowAroundSelection:
        () =>
        () =>
          true,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("screenplayFlowEditing"),
        props: {
          handleKeyDown(view, event) {
            if (event.isComposing) return false;
            if (event.key === "Enter" && handleEnter(view)) {
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
            if (event.key === "Backspace" && handleBackspace(view)) {
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
            if (event.key === "(" && splitFlatNodeToParen(view)) {
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
            if (event.key === ")" && splitParentheticalToDialogue(view)) {
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
