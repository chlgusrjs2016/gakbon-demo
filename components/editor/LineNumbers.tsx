/**
 * 노드 넘버 거터 (Node Numbers Gutter)
 *
 * A4 용지 왼쪽 바깥에 노드 순번(1,2,3...)을 표시합니다.
 * 줄바꿈된 문단이라도 번호는 해당 노드의 첫 줄 위치에만 1회 표시됩니다.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";

const NODE_NUMBER_OPTICAL_OFFSET = 2;

type NodeInfo = {
  /** A4 용지 상단 기준 세로 위치 (px) */
  top: number;
  /** 노드 번호 (1-based) */
  number: number;
  /** 블록의 인덱스 (0-based) */
  blockIndex: number;
  /** 블록의 line-height (px) */
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
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(-1);

  /* ── 노드 위치 계산 ── */
  const updateLines = useCallback(() => {
    if (!editor || !editor.view) return;

    const editorDom = editor.view.dom;
    const children = editorDom.children;
    const newNodes: NodeInfo[] = [];
    let nodeNumber = 1;

    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const style = window.getComputedStyle(el);
      const lh = parseFloat(style.lineHeight) || 26;
      const fs = parseFloat(style.fontSize) || 15;
      newNodes.push({
        // 첫 줄의 중앙선에 맞춰 번호를 배치합니다.
        // 글자 베이스라인 특성상 약간 위로 떠 보이므로 optical offset을 더합니다.
        top: topPadding + el.offsetTop + lh / 2 + NODE_NUMBER_OPTICAL_OFFSET,
        number: nodeNumber,
        blockIndex: i,
        lineHeight: lh,
        fontSize: fs,
      });
      nodeNumber++;
    }

    setNodes(newNodes);
  }, [editor, topPadding]);

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
  }, [editor, pageCount, updateLines, updateActiveLine]);

  if (nodes.length === 0) return null;

  return (
    <div
      className="absolute top-0 bottom-0 select-none pointer-events-none"
      style={{ right: "100%", width: 48 }}
    >
      {nodes.map((node) => {
        const isActive = node.blockIndex === activeBlockIndex;
        return (
          <div
            key={node.number}
            className={[
              "absolute right-0 pr-4 text-right transition-colors duration-150",
              isActive
                ? "text-zinc-700 dark:text-zinc-200 font-semibold"
                : "text-zinc-400 dark:text-zinc-500",
            ].join(" ")}
            style={{
              top: node.top,
              transform: "translateY(-50%)",
              lineHeight: "1",
              fontSize: Math.min(node.fontSize, 12),
            }}
          >
            {node.number}
          </div>
        );
      })}
    </div>
  );
}
