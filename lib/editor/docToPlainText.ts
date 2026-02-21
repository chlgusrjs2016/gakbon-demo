/**
 * TipTap JSONContent를 읽기용 원문(plain text)으로 변환합니다.
 * Phase 1: API 컨텍스트로 "현재 시나리오 전체"를 넘길 때 사용합니다.
 */

import type { JSONContent } from "@tiptap/react";

function getTextFromNode(node: JSONContent): string {
  if (!node.content || !Array.isArray(node.content)) return "";
  return node.content
    .map((child) => {
      if (child.type === "text" && "text" in child && child.text) return child.text;
      return getTextFromNode(child);
    })
    .join("");
}

/**
 * doc.content 배열의 각 블록을 한 줄씩 이어 붙인 원문 문자열을 반환합니다.
 */
export function jsonContentToPlainText(json: JSONContent | null | undefined): string {
  if (!json?.content || !Array.isArray(json.content)) return "";
  return json.content
    .map((block) => getTextFromNode(block).trim())
    .filter(Boolean)
    .join("\n");
}
