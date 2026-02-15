/**
 * 괄호 지시 (Parenthetical) 노드
 *
 * 대사 앞이나 사이에 들어가는 연기 지시입니다.
 * 예: "(웃으며)" "(작은 목소리로)"
 *
 * 특징:
 * - 괄호로 감싸진 형태
 * - 대사와 비슷한 여백이지만 기울임꼴로 표시
 */

import { Node } from "@tiptap/core";

export const Parenthetical = Node.create({
  name: "parenthetical",

  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div[data-type='parenthetical']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "parenthetical",
        class: "parenthetical",
      },
      0,
    ];
  },

});
