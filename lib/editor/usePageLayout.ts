/**
 * @deprecated pageEngine/usePageRender.ts를 직접 사용하세요.
 * 기존 호출부 호환용 래퍼입니다.
 */
"use client";

import { usePageRender } from "./pageEngine/usePageRender";
export {
  PX_PER_INCH,
  PAGE_SIZE_PRESETS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_MARGINS as PAGE_MARGINS,
} from "./pageEngine/config";
export type { PageSizeKey } from "./pageEngine/types";
import { DEFAULT_PAGE_MARGINS } from "./pageEngine/config";
import type { Editor } from "@tiptap/react";
import type { PageSizeKey } from "./pageEngine/types";

export const TOP_MARGIN = DEFAULT_PAGE_MARGINS.top;
export const BOTTOM_MARGIN = DEFAULT_PAGE_MARGINS.bottom;
export const PAGE_GAP = 0;

export function usePageLayout(
  editor: Editor | null,
  options?: { pageHeight?: number; pageSizeKey?: PageSizeKey }
) {
  const pageSizeKey = options?.pageSizeKey ?? "a4";
  const result = usePageRender({
    editor,
    documentType: "screenplay",
    pageSizeKey,
  });
  return {
    pageCount: result.pageCount,
    canvasHeight: result.canvasHeight,
  };
}
