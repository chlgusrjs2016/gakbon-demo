/**
 * usePageLayout — A4 페이지 분할 훅
 *
 * TipTap 에디터의 블록 요소 DOM 위치를 읽어 페이지 경계를 계산하고,
 * 경계를 넘는 블록에 CSS margin-top을 주입하여 다음 페이지로 밀어냅니다.
 *
 * 에디터 인스턴스는 단일 연속 흐름을 유지하며,
 * 시각적으로만 다중 A4 페이지로 나뉘어 보입니다.
 */

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";

/* ── 상수 ── */
export const PAGE_WIDTH = 816; // 8.5" × 96dpi
export const PAGE_HEIGHT = 1056; // 11" × 96dpi
export const TOP_MARGIN = 96; // 상단 1인치
export const BOTTOM_MARGIN = 96; // 하단 1인치
export const CONTENT_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN; // 864px
export const PAGE_GAP = 32; // 페이지 사이 시각적 간격 (px)

type UsePageLayoutReturn = {
  /** 현재 페이지 수 (최소 1) */
  pageCount: number;
};

/**
 * 에디터 DOM을 순회하며 페이지 경계를 계산하고 margin을 주입합니다.
 *
 * 알고리즘 (DOM 위치 기반):
 * 1. 모든 블록의 기존 주입 margin을 제거 (초기화)
 * 2. 강제 reflow 후 각 블록의 실제 offsetTop, offsetHeight를 읽음
 * 3. 블록의 하단(offsetTop + offsetHeight)이 현재 페이지의 콘텐츠 영역을
 *    넘으면 해당 블록을 다음 페이지로 밀어냄
 * 4. 밀어낼 margin = (페이지 하단까지 남은 공간) + BOTTOM_MARGIN + PAGE_GAP + TOP_MARGIN
 * 5. 이후 블록들은 누적된 shift만큼 위치가 밀리므로, 이를 추적하며 계산
 */
function calculatePageBreaks(editor: Editor): number {
  const view = editor.view;
  const editorDom = view.dom;
  const children = editorDom.children;

  if (children.length === 0) return 1;

  /* ── ProseMirror의 DOM 감시자를 일시 정지 ──
   * 우리가 주입하는 margin-top 스타일 변경을 ProseMirror가 감지하면
   * "rogue mutation"으로 간주하고 DOM을 복원 → update 이벤트 → 무한 루프.
   * 따라서 수정 전에 옵저버를 멈추고, 수정 후 다시 시작합니다.             */
  const domObserver = (view as any).domObserver;
  if (domObserver) domObserver.stop();

  try {
    // ── 1단계: 기존 주입 margin 초기화 ──
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      if (el.dataset.pageBreakMargin) {
        el.style.marginTop = "";
        delete el.dataset.pageBreakMargin;
      }
    }

    // ── 2단계: 강제 reflow → 자연 상태의 위치 읽기 ──
    void editorDom.offsetHeight;

    type BlockInfo = {
      el: HTMLElement;
      top: number;
      bottom: number;
      height: number;
      originalMarginTop: number;
    };

    const blocks: BlockInfo[] = [];
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const top = el.offsetTop;
      const height = el.offsetHeight;
      const computed = window.getComputedStyle(el);
      blocks.push({
        el,
        top,
        bottom: top + height,
        height,
        originalMarginTop: parseFloat(computed.marginTop) || 0,
      });
    }

    // ── 3단계: 페이지 경계 계산 및 margin 주입 ──
    let pageCount = 1;
    let pageContentEnd = CONTENT_HEIGHT;
    let cumulativeShift = 0;

    for (const block of blocks) {
      const shiftedTop = block.top + cumulativeShift;
      const shiftedBottom = block.bottom + cumulativeShift;

      // 블록 자체가 페이지보다 큰 극단적 경우 → 그냥 넣음
      if (block.height > CONTENT_HEIGHT) continue;

      // 블록의 하단이 현재 페이지 콘텐츠 영역을 넘는지 확인
      if (shiftedBottom > pageContentEnd) {
        const spaceToEnd = pageContentEnd - shiftedTop;
        const gapNeeded = spaceToEnd + BOTTOM_MARGIN + PAGE_GAP + TOP_MARGIN;

        block.el.style.marginTop = `${block.originalMarginTop + gapNeeded}px`;
        block.el.dataset.pageBreakMargin = "true";

        cumulativeShift += gapNeeded;
        pageCount++;
        pageContentEnd += BOTTOM_MARGIN + PAGE_GAP + TOP_MARGIN + CONTENT_HEIGHT;
      }
    }

    return pageCount;
  } finally {
    // ── 옵저버 재시작 ──
    if (domObserver) domObserver.start();
  }
}

export function usePageLayout(editor: Editor | null): UsePageLayoutReturn {
  const [pageCount, setPageCount] = useState(1);

  const refresh = useCallback(() => {
    if (!editor || !editor.view) return;

    requestAnimationFrame(() => {
      if (!editor || editor.isDestroyed) return;
      const count = calculatePageBreaks(editor);
      setPageCount(count);
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    refresh();
    editor.on("update", refresh);
    editor.on("create", refresh);

    window.addEventListener("resize", refresh);

    return () => {
      editor.off("update", refresh);
      editor.off("create", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, [editor, refresh]);

  return { pageCount };
}
