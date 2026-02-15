/**
 * 에디터 페이지 레이아웃 (Client Component)
 *
 * 3컬럼 레이아웃: 왼쪽 네비게이터 + 가운데 에디터 + 오른쪽 AI 어시스트.
 * 상단 헤더에는 Lucide 아이콘(세로 배치) 도구 버튼과 커스텀 노드타입 드롭다운이 있습니다.
 * 에디터 영역은 정확한 A4 사이즈(816x1056px)로 렌더됩니다.
 * 배경/UI는 그레이스케일 톤입니다.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Settings,
  Palette,
  SplitSquareHorizontal,
  List,
  Sparkles,
  GitBranch,
  Save,
  Send,
  Share2,
  Download,
} from "lucide-react";
import ScenarioEditor from "@/components/editor/ScenarioEditor";
import NavigatorSidebar from "@/components/editor/NavigatorSidebar";
import AssistSidebar from "@/components/editor/AssistSidebar";
import NodeTypeDropdown from "@/components/editor/NodeTypeDropdown";
import Ruler from "@/components/editor/Ruler";
import LineNumbers from "@/components/editor/LineNumbers";
import { usePageLayout, PAGE_WIDTH, PAGE_HEIGHT, PAGE_GAP, TOP_MARGIN } from "@/lib/editor/usePageLayout";
import { saveDocument } from "@/app/actions/document";
import type { JSONContent, Editor } from "@tiptap/react";

const FORMAT_OPTIONS = [
  { value: "us", label: "미국" },
];

/* ── 포맷 선택 팝업 메뉴 ── */
function FormatMenu({
  value,
  options,
  onChange,
  onClose,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={[
        "absolute left-0 top-full z-[100] mt-1.5",
        "min-w-[120px] rounded-xl py-1.5",
        "bg-white/40 dark:bg-zinc-900/40",
        "backdrop-blur-3xl saturate-150",
        "border border-white/60 dark:border-white/[0.1]",
        "shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_0.5px_0_rgba(255,255,255,0.5)]",
        "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
      ].join(" ")}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "flex w-full items-center px-3 py-2 text-xs",
            "transition-all duration-100",
            opt.value === value
              ? "bg-white/50 dark:bg-white/[0.1] font-semibold text-zinc-900 dark:text-white"
              : "text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

type Project = {
  id: string;
  title: string;
};

type Document = {
  id: string;
  title: string;
  content: JSONContent | null;
  project_id: string;
};

export default function EditorPage({
  project,
  document,
}: {
  project: Project;
  document: Document | null;
}) {
  const router = useRouter();

  /* ── 저장 상태 ── */
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved"
  >("saved");

  /* ── TipTap 에디터 참조 ── */
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  /* ── 현재 노드타입 ── */
  const [currentNodeType, setCurrentNodeType] = useState("paragraph");

  /* ── 현재 포맷 ── */
  const [currentFormat, setCurrentFormat] = useState("us");

  /* ── 포맷 메뉴 토글 ── */
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  /* ── 사이드바 토글 ── */
  const [showNavigator, setShowNavigator] = useState(false);
  const [showAssist, setShowAssist] = useState(false);

  /* ── 디바운스 타이머 ── */
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ── 에디터 커서 위치 변경 시 현재 노드타입 추적 ── */
  useEffect(() => {
    if (!editorInstance) return;

    const updateNodeType = () => {
      const { $from } = editorInstance.state.selection;
      const nodeName = $from.parent.type.name;
      setCurrentNodeType(nodeName);
    };

    editorInstance.on("selectionUpdate", updateNodeType);
    editorInstance.on("transaction", updateNodeType);
    return () => {
      editorInstance.off("selectionUpdate", updateNodeType);
      editorInstance.off("transaction", updateNodeType);
    };
  }, [editorInstance]);

  /* ── 노드타입 변경 핸들러 ── */
  const handleNodeTypeChange = useCallback(
    (nodeType: string) => {
      if (!editorInstance) return;
      if (nodeType === "paragraph") {
        editorInstance.chain().focus().setParagraph().run();
      } else {
        editorInstance.chain().focus().setNode(nodeType).run();
      }
    },
    [editorInstance]
  );

  /* ── 자동 저장 핸들러 ── */
  const handleUpdate = useCallback(
    (content: JSONContent) => {
      if (!document) return;
      setSaveStatus("unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        const result = await saveDocument(document.id, content);
        setSaveStatus(result.success ? "saved" : "unsaved");
      }, 1500);
    },
    [document]
  );

  /* ── 에디터 준비 콜백 ── */
  const handleEditorReady = useCallback((editor: Editor) => {
    setEditorInstance(editor);
  }, []);

  /* ── 페이지 분할 ── */
  const { pageCount } = usePageLayout(editorInstance);

  /* ── 헤더 버튼: 세로 아이콘+라벨 스타일 ── */
  const headerBtnClass = [
    "flex flex-col items-center gap-0.5 h-auto py-1.5 w-14",
    "rounded-lg font-medium text-zinc-500 dark:text-zinc-400",
    "transition-all duration-150",
    "hover:bg-zinc-100/60 dark:hover:bg-white/[0.06]",
    "active:scale-95",
  ].join(" ");

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {/* ── 배경 (그레이스케일) ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />
      </div>

      {/* ===== 헤더 바 (Liquid Glass 둥근 박스) ===== */}
      <div className="shrink-0 z-50 mx-3 mt-3">
        <header
          className={[
            "relative flex items-center justify-between",
            "rounded-2xl px-4 py-3",
            "bg-white/30 dark:bg-white/[0.04]",
            "backdrop-blur-2xl",
            "border border-white/60 dark:border-white/[0.1]",
            "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
            "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
          ].join(" ")}
        >
        {/* ── 왼쪽: 뒤로가기 + 프로젝트명 + 도구 버튼 ── */}
        <div className="flex items-center gap-0.5">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/")}
            className={[
              "flex items-center justify-center h-8 w-8 rounded-lg",
              "text-zinc-500 dark:text-zinc-400",
              "transition-all duration-150",
              "hover:bg-zinc-100/60 dark:hover:bg-white/[0.06]",
              "active:scale-95",
            ].join(" ")}
            title="대시보드로 돌아가기"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* 구분선 */}
          <div className="mx-1.5 h-6 w-px bg-zinc-200/60 dark:bg-white/[0.06]" />

          {/* 포맷 버튼 + 드롭다운 (다른 버튼과 동일한 세로 배치) */}
          <div className="relative">
            <button
              className={headerBtnClass}
              title="포맷"
              onClick={() => setShowFormatMenu((v) => !v)}
            >
              <Settings className="h-4 w-4" />
              <span className="text-[10px]">포맷</span>
            </button>
            {showFormatMenu && (
              <FormatMenu
                value={currentFormat}
                options={FORMAT_OPTIONS}
                onChange={(v) => { setCurrentFormat(v); setShowFormatMenu(false); }}
                onClose={() => setShowFormatMenu(false)}
              />
            )}
          </div>
          <button className={headerBtnClass} title="스타일">
            <Palette className="h-4 w-4" />
            <span className="text-[10px]">스타일</span>
          </button>
          <button className={headerBtnClass} title="분할">
            <SplitSquareHorizontal className="h-4 w-4" />
            <span className="text-[10px]">분할</span>
          </button>
          <button
            className={`${headerBtnClass} ${showNavigator ? "bg-zinc-100/60 dark:bg-white/[0.06]" : ""}`}
            title="네비게이터"
            onClick={() => setShowNavigator((v) => !v)}
          >
            <List className="h-4 w-4" />
            <span className="text-[10px]">네비게이터</span>
          </button>
          <button
            className={`${headerBtnClass} ${showAssist ? "bg-zinc-100/60 dark:bg-white/[0.06]" : ""}`}
            title="어시스트"
            onClick={() => setShowAssist((v) => !v)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px]">어시스트</span>
          </button>
          <button className={headerBtnClass} title="브랜치">
            <GitBranch className="h-4 w-4" />
            <span className="text-[10px]">브랜치</span>
          </button>

          {/* 구분선 */}
          <div className="mx-1.5 h-6 w-px bg-zinc-200/60 dark:bg-white/[0.06]" />

          {/* 프로젝트명 */}
          <span className="font-title text-xs font-bold text-zinc-800 dark:text-zinc-100">
            {project.title}
          </span>
        </div>

        {/* ── 가운데: 스타일 라벨(위) + 커스텀 노드타입 드롭다운(아래) — 헤더 정중앙 고정 ── */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            스타일
          </span>
          <NodeTypeDropdown
            value={currentNodeType}
            onChange={handleNodeTypeChange}
          />
        </div>

        {/* ── 오른쪽: 저장 상태 + 도구 버튼 ── */}
        <div className="flex items-center gap-0.5">
          {/* 저장 상태 */}
          <span className="mr-2 text-[11px]">
            {saveStatus === "saved" && (
              <span className="text-zinc-400 dark:text-zinc-500">저장됨</span>
            )}
            {saveStatus === "saving" && (
              <span className="text-zinc-500 dark:text-zinc-400">저장 중...</span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-500 dark:text-amber-400">
                저장되지 않음
              </span>
            )}
          </span>

          <button className={headerBtnClass} title="저장">
            <Save className="h-4 w-4" />
            <span className="text-[10px]">저장</span>
          </button>
          <button className={headerBtnClass} title="공유">
            <Share2 className="h-4 w-4" />
            <span className="text-[10px]">공유</span>
          </button>
          <button className={headerBtnClass} title="내보내기">
            <Download className="h-4 w-4" />
            <span className="text-[10px]">내보내기</span>
          </button>
          <button className={headerBtnClass} title="발송">
            <Send className="h-4 w-4" />
            <span className="text-[10px]">발송</span>
          </button>
        </div>
        </header>
      </div>

      {/* ===== 본문 (에디터 전체 폭 + 사이드바 오버레이) ===== */}
      <div className="relative flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 (오버레이 + 슬라이딩) */}
        <div
          className={[
            "absolute left-0 top-0 bottom-0 z-30",
            "transition-transform duration-300 ease-in-out",
            showNavigator ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <NavigatorSidebar editor={editorInstance} />
        </div>

        {/* 에디터 (전체 폭) */}
        <main className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-gray-100/50 to-gray-50/50 dark:from-zinc-900/50 dark:to-zinc-950/50">
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-8">
            {/* Ruler — A4 폭, 상단 고정 */}
            <div className="sticky top-0 z-20 shrink-0 pt-4 pb-0 bg-gradient-to-b from-gray-100/80 via-gray-100/60 to-transparent dark:from-zinc-900/80 dark:via-zinc-900/60 dark:to-transparent" style={{ width: 816 }}>
              <Ruler />
            </div>

            {/* A4 용지 (다중 페이지) + 라인 넘버 래퍼 */}
            <div
              className="relative shrink-0"
              style={{
                width: PAGE_WIDTH,
                minHeight: pageCount * PAGE_HEIGHT + (pageCount - 1) * PAGE_GAP,
              }}
            >
              {/* N장의 A4 배경 (absolute, pointer-events: none) */}
              {Array.from({ length: pageCount }, (_, i) => (
                <div
                  key={i}
                  className={[
                    "absolute left-0 pointer-events-none",
                    "bg-white dark:bg-zinc-900",
                    "border border-zinc-200/60 dark:border-white/[0.06]",
                    "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.3)]",
                    "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]",
                  ].join(" ")}
                  style={{
                    top: i * (PAGE_HEIGHT + PAGE_GAP),
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                  }}
                />
              ))}

              {/* 라인 넘버 거터 — A4 왼쪽 바깥 */}
              <LineNumbers editor={editorInstance} pageCount={pageCount} />

              {/* 에디터 (연속 흐름, 첫 페이지 상단 여백) */}
              <div
                className="relative"
                style={{
                  paddingTop: TOP_MARGIN,
                  minHeight: PAGE_HEIGHT,
                }}
              >
                {document ? (
                  <ScenarioEditor
                    content={document.content}
                    onUpdate={handleUpdate}
                    onEditorReady={handleEditorReady}
                  />
                ) : (
                  <p className="text-center text-sm text-zinc-400">
                    문서를 찾을 수 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 용지 아래 여백 */}
            <div className="h-12 shrink-0" />
          </div>
        </main>

        {/* 오른쪽 사이드바 (오버레이 + 슬라이딩) */}
        <div
          className={[
            "absolute right-0 top-0 bottom-0 z-30",
            "transition-transform duration-300 ease-in-out",
            showAssist ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <AssistSidebar />
        </div>
      </div>
    </div>
  );
}
