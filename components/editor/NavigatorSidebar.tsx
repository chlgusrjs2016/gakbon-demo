/**
 * 네비게이터 사이드바 (왼쪽)
 *
 * TipTap 에디터 데이터와 연동하여 장면(Scene)과 인물(Character) 목록을 자동 추출합니다.
 * - 장면: 씬 헤딩 노드의 텍스트를 표시하고, 클릭 시 해당 위치로 스크롤합니다.
 * - 인물: 등장인물 노드에서 중복 없이 추출하고, 클릭 시 해당 인물명을 노란색으로 하이라이트합니다.
 * - 푸터: 라인 수, 장면 수, 인물 수를 실시간 표시합니다.
 *
 * 디자인: 여백 있는 둥근 Liquid Glass 패널 + 흰색 보더
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { List } from "lucide-react";
import type { Editor } from "@tiptap/react";

/* ── 타입 정의 ── */
type SceneInfo = {
  /** 씬 헤딩 노드의 doc 내 position */
  pos: number;
  /** 씬 번호 (1-based) */
  number: number;
  /** 씬 헤딩 텍스트 */
  text: string;
};

type NavStats = {
  lineCount: number;
  sceneCount: number;
  characterCount: number;
};

/* ── 에디터에서 데이터 추출 ── */
function extractScenes(editor: Editor): SceneInfo[] {
  const scenes: SceneInfo[] = [];
  let sceneNumber = 0;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "sceneHeading") {
      sceneNumber++;
      scenes.push({
        pos,
        number: sceneNumber,
        text: node.textContent || "(빈 씬 헤딩)",
      });
    }
  });

  return scenes;
}

function extractCharacters(editor: Editor): string[] {
  const names = new Set<string>();

  editor.state.doc.descendants((node) => {
    if (node.type.name === "character") {
      const name = node.textContent.trim();
      if (name) names.add(name.toUpperCase());
    }
  });

  return Array.from(names).sort();
}

/**
 * 시각적 라인 수를 계산합니다.
 * 각 블록 DOM 요소의 실제 높이를 line-height로 나누어
 * A4 폭에서 줄바꿈된 시각적 라인까지 포함합니다.
 * 빈 블록은 제외합니다.
 */
function countLines(editor: Editor): number {
  let lines = 0;

  const editorDom = editor.view.dom;
  const children = editorDom.children;

  for (let i = 0; i < children.length; i++) {
    const el = children[i] as HTMLElement;
    const text = el.textContent?.trim() ?? "";
    if (text === "") continue; // 빈 블록 제외

    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 26; // fallback 26px
    const height = el.getBoundingClientRect().height;

    // 시각적 줄 수 = 요소 높이 / 줄 높이 (최소 1줄)
    lines += Math.max(1, Math.round(height / lineHeight));
  }

  return lines;
}

/* ── 컴포넌트 ── */
type Props = {
  editor: Editor | null;
};

export default function NavigatorSidebar({ editor }: Props) {
  const [scenes, setScenes] = useState<SceneInfo[]>([]);
  const [characters, setCharacters] = useState<string[]>([]);
  const [stats, setStats] = useState<NavStats>({
    lineCount: 0,
    sceneCount: 0,
    characterCount: 0,
  });
  const [highlightedCharacter, setHighlightedCharacter] = useState<
    string | null
  >(null);

  /* ── 에디터 변경 시 데이터 재추출 ── */
  const refresh = useCallback(() => {
    if (!editor) return;

    const newScenes = extractScenes(editor);
    const newCharacters = extractCharacters(editor);
    const lineCount = countLines(editor);

    setScenes(newScenes);
    setCharacters(newCharacters);
    setStats({
      lineCount,
      sceneCount: newScenes.length,
      characterCount: newCharacters.length,
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    // 초기 추출
    refresh();

    // 에디터 업데이트마다 재추출
    editor.on("update", refresh);
    return () => {
      editor.off("update", refresh);
    };
  }, [editor, refresh]);

  /* ── 장면 클릭: 해당 위치로 스크롤 ── */
  const handleSceneClick = useCallback(
    (pos: number) => {
      if (!editor) return;

      // 해당 노드의 시작 위치로 커서 이동
      editor.chain().focus().setTextSelection(pos + 1).run();

      // DOM 요소로 스크롤
      const domAtPos = editor.view.domAtPos(pos + 1);
      const element = domAtPos.node as HTMLElement;
      const targetEl =
        element.nodeType === Node.TEXT_NODE
          ? element.parentElement
          : element;

      targetEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [editor],
  );

  /* ── 하이라이트 제거 ── */
  const clearHighlight = useCallback(() => {
    if (!editor) return;
    const editorDom = editor.view.dom;
    editorDom
      .querySelectorAll('[data-type="character"]')
      .forEach((el) => {
        (el as HTMLElement).style.backgroundColor = "";
        (el as HTMLElement).style.borderRadius = "";
      });
  }, [editor]);

  /* ── 인물 클릭: 노란색 하이라이트 토글 ── */
  const handleCharacterClick = useCallback(
    (name: string) => {
      if (!editor) return;

      // 이미 하이라이트 중인 인물을 다시 누르면 해제
      if (highlightedCharacter === name) {
        clearHighlight();
        setHighlightedCharacter(null);
        return;
      }

      // 기존 하이라이트 제거
      clearHighlight();

      // 해당 인물 노드에 인라인 스타일로 하이라이트 적용
      const editorDom = editor.view.dom;
      const characterNodes = editorDom.querySelectorAll(
        '[data-type="character"]',
      );

      characterNodes.forEach((el) => {
        const text = el.textContent?.trim().toUpperCase();
        if (text === name) {
          (el as HTMLElement).style.backgroundColor = "rgba(250, 204, 21, 0.35)";
          (el as HTMLElement).style.borderRadius = "4px";
        }
      });

      setHighlightedCharacter(name);
    },
    [editor, highlightedCharacter, clearHighlight],
  );

  return (
    <div className="flex h-full w-[280px] shrink-0 p-2">
      <aside
        className={[
          "flex flex-1 flex-col",
          "rounded-2xl",
          "bg-white/30 dark:bg-white/[0.04]",
          "backdrop-blur-2xl",
          "border border-white/60 dark:border-white/[0.1]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
          "overflow-hidden",
        ].join(" ")}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 dark:border-white/[0.06]">
          <List className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            네비게이터
          </span>
        </div>

        {/* 스크롤 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* ── 장면 섹션 ── */}
          <div className="mb-4">
            <h3 className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <span>장면 ({stats.sceneCount})</span>
            </h3>
            <div className="space-y-1">
              {scenes.length > 0 ? (
                scenes.map((scene) => (
                  <button
                    key={scene.pos}
                    onClick={() => handleSceneClick(scene.pos)}
                    className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/50 dark:hover:bg-white/[0.04]"
                  >
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      장면 {scene.number}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                      {scene.text}
                    </p>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                  씬 헤딩이 없습니다.
                </p>
              )}
            </div>
          </div>

          {/* ── 인물 섹션 ── */}
          <div>
            <h3 className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              <span>인물 ({stats.characterCount})</span>
            </h3>
            <div className="space-y-0.5">
              {characters.length > 0 ? (
                characters.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleCharacterClick(name)}
                    className={[
                      "w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors",
                      highlightedCharacter === name
                        ? "bg-white/50 dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-100 font-semibold"
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    {name}
                  </button>
                ))
              ) : (
                <p className="px-3 py-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  등장인물이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 하단 통계 */}
        <div className="border-t border-white/40 dark:border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <span>라인 수:</span>
            <span>{stats.lineCount}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <span>장면 수:</span>
            <span>{stats.sceneCount}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
            <span>인물 수:</span>
            <span>{stats.characterCount}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
