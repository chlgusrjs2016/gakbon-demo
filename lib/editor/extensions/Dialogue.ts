/**
 * 대사 (Dialogue) 노드
 *
 * 등장인물이 말하는 대사입니다.
 * 예: "안녕하세요, 오랜만이에요."
 *
 * 특징:
 * - 좌우 여백이 있어 본문과 구분
 * - 등장인물(Character) 아래에 위치
 */

import { Node } from "@tiptap/core";

export const Dialogue = Node.create({
  name: "dialogue",

  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div[data-type='dialogue']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "dialogue",
        class: "dialogue",
      },
      0,
    ];
  },

});
