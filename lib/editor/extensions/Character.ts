/**
 * 등장인물 (Character) 노드
 *
 * 대사를 말하는 인물의 이름입니다.
 * 예: "민수"
 *
 * 특징:
 * - 가운데 정렬
 * - 대문자/굵게 표시
 * - 대사(Dialogue) 바로 위에 위치
 */

import { Node } from "@tiptap/core";

export const Character = Node.create({
  name: "character",

  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div[data-type='character']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "character",
        class: "character",
      },
      0,
    ];
  },

});
