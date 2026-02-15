/**
 * 전환 (Transition) 노드
 *
 * 장면과 장면 사이의 전환 지시입니다.
 * 예: "CUT TO:", "FADE IN:", "디졸브"
 *
 * 특징:
 * - 오른쪽 정렬
 * - 대문자 표시
 */

import { Node } from "@tiptap/core";

export const Transition = Node.create({
  name: "transition",

  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div[data-type='transition']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "transition",
        class: "transition-block",
      },
      0,
    ];
  },

});
