/**
 * AI 어시스트 사이드바 (오른쪽)
 *
 * AI 에이전트와 대화하며 시나리오 수정/보완을 받는 채팅 패널입니다.
 * 현재는 UI 껍데기만 구현되어 있으며,
 * Phase 2에서 Vercel AI SDK로 실제 AI 연동 예정입니다.
 *
 * 디자인: 여백 있는 둥근 Liquid Glass 패널 + 흰색 보더
 */
"use client";

import { useState } from "react";
import { Sparkles, Plus, Send } from "lucide-react";
import GlassDropdown from "@/components/ui/GlassDropdown";

const MODE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "ask", label: "질문" },
  { value: "edit", label: "수정" },
];

export default function AssistSidebar() {
  const [mode, setMode] = useState("auto");

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">어시스트</span>
          </div>

          {/* 모드 드롭다운 (Liquid Glass) */}
          <GlassDropdown
            value={mode}
            options={MODE_OPTIONS}
            onChange={setMode}
            size="sm"
            align="right"
            menuWidth={120}
          />
        </div>

        {/* 채팅 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* AI 인사 메시지 */}
          <div className="flex flex-col gap-1">
            <div className="rounded-xl rounded-tl-sm bg-white/15 dark:bg-white/[0.04] px-3 py-2.5">
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                안녕하세요! 시나리오 작성을 도와드리겠습니다. 무엇을 도와드릴까요?
              </p>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">오전 09:47</span>
          </div>

          {/* 빈 상태 안내 */}
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              시나리오에 대해 질문하거나,<br />
              수정을 요청해보세요.
            </p>
          </div>
        </div>

        {/* 하단 입력 영역 */}
        <div className="border-t border-white/40 dark:border-white/[0.06] px-3 py-3">
          <div className="flex items-end gap-2 rounded-xl bg-white/10 dark:bg-white/[0.04] border border-white/30 dark:border-white/[0.08] px-3 py-2">
            {/* 첨부 버튼 */}
            <button
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/60 hover:text-zinc-600 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300"
              title="파일 첨부"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* 입력란 */}
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-transparent text-xs text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
              disabled
            />

            {/* 전송 버튼 */}
            <button
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/60 hover:text-zinc-600 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300"
              title="전송"
              disabled
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
