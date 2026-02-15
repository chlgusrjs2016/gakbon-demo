/**
 * 씬 헤딩 (Scene Heading) 노드
 *
 * 시나리오에서 새로운 장면이 시작될 때 사용합니다.
 * 예: "S#1. 카페 안 (낮)"
 *
 * 특징:
 * - 대문자로 표시
 * - 배경색으로 구분
 * - Courier Prime 폰트 사용
 */

import { Node } from "@tiptap/core";

export const SceneHeading = Node.create({
  name: "sceneHeading",

  // 이 노드는 문서의 최상위 블록으로만 사용됩니다.
  group: "block",

  // 텍스트 내용을 가집니다.
  content: "inline*",

  // HTML에서 이 노드를 인식하는 방법
  parseHTML() {
    return [
      {
        tag: "div[data-type='scene-heading']",
      },
    ];
  },

  // 이 노드를 HTML로 렌더링하는 방법
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "scene-heading",
        class: "scene-heading",
      },
      0, // 0 = 자식 콘텐츠가 들어갈 자리
    ];
  },

});
