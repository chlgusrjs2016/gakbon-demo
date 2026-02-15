/**
 * 라인 넘버 거터 (Line Numbers Gutter)
 *
 * A4 용지 왼쪽 바깥에 시각적 줄 번호를 표시합니다.
 * 한 블록이 A4 폭에서 줄바꿈되면, 줄바꿈된 라인마다 별도 번호가 매겨집니다.
 * 커서가 위치한 라인(블록의 첫 번째 시각적 줄)은 밝게 하이라이트됩니다.
 * 각 번호의 line-height를 에디터 블록의 line-height에 맞춰 정렬합니다.
 * 우측 정렬, 별도 박스 없이 숫자만 표시합니다.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";

type LineInfo = {
  /** A4 용지 상단 기준 세로 위치 (px) */
  top: number;
  /** 시각적 라인 번호 (1-based) */
  number: number;
  /** 이 라인이 속한 블록의 인덱스 (0-based) */
  blockIndex: number;
  /** 블록 내 첫 번째 시각적 줄인지 여부 */
  isFirstOfBlock: boolean;
  /** 해당 블록의 computed line-height (px) */
  lineHeight: number;
  /** 해당 블록의 font-size (px) — 거터 숫자도 동일 크기로 표시 */
  fontSize: number;
};

type Props = {
  editor: Editor | null;
  /** py-[96px] 상단 패딩 값 */
  topPadding?: number;
  /** 페이지 분할 수 — 변경 시 라인 위치를 재계산합니다 */
  pageCount?: number;
};

export default function LineNumbers({ editor, topPadding = 96, pageCount = 1 }: Props) {
  const [lines, setLines] = useState<LineInfo[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(-1);

  /* ── 시각적 줄 위치 계산 ── */
  const updateLines = useCallback(() => {
    if (!editor || !editor.view) return;

    const editorDom = editor.view.dom;
    const children = editorDom.children;
    const newLines: LineInfo[] = [];
    let lineNumber = 1;

    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const style = window.getComputedStyle(el);
      const lh = parseFloat(style.lineHeight) || 26;
      const fs = parseFloat(style.fontSize) || 15;
      const rect = el.getBoundingClientRect();
      const visualLines = Math.max(1, Math.round(rect.height / lh));

      for (let v = 0; v < visualLines; v++) {
        newLines.push({
          top: topPadding + el.offsetTop + v * lh,
          number: lineNumber,
          blockIndex: i,
          isFirstOfBlock: v === 0,
          lineHeight: lh,
          fontSize: fs,
        });
        lineNumber++;
      }
    }

    setLines(newLines);
  }, [editor, topPadding, pageCount]);

  /* ── 커서 위치 → 현재 블록 인덱스 추적 ── */
  const updateActiveLine = useCallback(() => {
    if (!editor || !editor.view) return;

    const { $from } = editor.state.selection;
    let blockIndex = -1;

    editor.state.doc.forEach((node, offset, index) => {
      const start = offset;
      const end = offset + node.nodeSize;
      if ($from.pos >= start && $from.pos <= end) {
        blockIndex = index;
      }
    });

    setActiveBlockIndex(blockIndex);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const refresh = () => {
      requestAnimationFrame(() => {
        updateLines();
        updateActiveLine();
      });
    };

    refresh();
    editor.on("update", refresh);
    editor.on("create", refresh);
    editor.on("selectionUpdate", updateActiveLine);

    window.addEventListener("resize", refresh);

    return () => {
      editor.off("update", refresh);
      editor.off("create", refresh);
      editor.off("selectionUpdate", updateActiveLine);
      window.removeEventListener("resize", refresh);
    };
  }, [editor, updateLines, updateActiveLine]);

  if (lines.length === 0) return null;

  return (
    <div
      className="absolute top-0 bottom-0 select-none pointer-events-none"
      style={{ right: "100%", width: 48 }}
    >
      {lines.map((line) => {
        const isActive =
          line.blockIndex === activeBlockIndex && line.isFirstOfBlock;
        return (
          <div
            key={line.number}
            className={[
              "absolute right-0 pr-4 text-right transition-colors duration-150",
              isActive
                ? "text-zinc-700 dark:text-zinc-200 font-semibold"
                : "text-zinc-400 dark:text-zinc-500",
            ].join(" ")}
            style={{
              top: line.top,
              height: line.lineHeight,
              lineHeight: `${line.lineHeight}px`,
              fontSize: Math.min(line.fontSize, 12),
            }}
          >
            {line.number}
          </div>
        );
      })}
    </div>
  );
}
