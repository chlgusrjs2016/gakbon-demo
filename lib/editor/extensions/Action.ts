/**
 * 지문 (Action) 노드
 *
 * 장면의 상황, 인물의 행동 등을 서술합니다.
 * 예: "민수가 천천히 문을 열고 카페 안으로 들어온다."
 *
 * 특징:
 * - 왼쪽 정렬, 일반 본문 스타일
 * - 시나리오에서 가장 많이 사용되는 노드
 */

import { Node } from "@tiptap/core";

export const Action = Node.create({
  name: "action",

  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      {
        tag: "div[data-type='action']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "action",
        class: "action",
      },
      0,
    ];
  },

});
