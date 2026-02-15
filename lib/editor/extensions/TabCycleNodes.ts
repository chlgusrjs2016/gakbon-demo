/**
 * Tab 키로 노드 타입 순환 (TabCycleNodes)
 *
 * Tab 키를 누르면 현재 노드가 다음 노드 타입으로 변경됩니다.
 * Shift+Tab을 누르면 이전 노드 타입으로 돌아갑니다.
 *
 * 순서: 일반 → 씬 헤딩 → 지문 → 등장인물 → 대사 → 괄호지시 → 전환 → 일반 ...
 *
 * ProseMirror handleKeyDown을 사용하여 브라우저 기본 Tab 동작(포커스 이동)을
 * 확실히 차단합니다.
 */

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const NODE_CYCLE = [
  "paragraph",
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
] as const;

function cycleNode(editor: Editor, direction: 1 | -1): boolean {
  const { $from } = editor.state.selection;
  const currentType = $from.parent.type.name;
  const currentIndex = NODE_CYCLE.indexOf(
    currentType as (typeof NODE_CYCLE)[number]
  );

  if (currentIndex === -1) return false;

  const nextIndex =
    (currentIndex + direction + NODE_CYCLE.length) % NODE_CYCLE.length;
  const nextType = NODE_CYCLE[nextIndex];

  if (nextType === "paragraph") {
    editor.chain().focus().setParagraph().run();
  } else {
    editor.chain().focus().setNode(nextType).run();
  }

  return true;
}

export const TabCycleNodes = Extension.create({
  name: "tabCycleNodes",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: new PluginKey("tabCycleNodes"),
        props: {
          handleKeyDown(_view, event) {
            if (event.key !== "Tab") return false;

            // Tab 또는 Shift+Tab
            const direction = event.shiftKey ? -1 : 1;
            const handled = cycleNode(editor, direction);

            if (handled) {
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
