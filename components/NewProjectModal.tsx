/**
 * 새 프로젝트 생성 모달 컴포넌트
 *
 * "모달"이란?
 * 화면 위에 뜨는 팝업 창입니다. 배경이 어두워지고,
 * 가운데에 입력 폼이 표시됩니다.
 *
 * 사용 흐름:
 * 1. "새 프로젝트" 버튼 클릭 → 모달 열림
 * 2. 제목 입력 → "만들기" 클릭
 * 3. 서버에서 프로젝트 생성 → 모달 닫힘 → 목록 갱신
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions/project";

export default function NewProjectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 모달이 닫혀있으면 아무것도 렌더링하지 않습니다.
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    // 폼의 기본 동작(페이지 새로고침)을 막습니다.
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // FormData 객체를 만들어서 서버 액션에 전달합니다.
    const formData = new FormData();
    formData.append("title", title);

    const result = await createProject(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // 성공 → 모달 닫기 + 프로젝트 에디터로 이동
    setTitle("");
    setIsLoading(false);
    onClose();
    router.refresh();
  };

  return (
    // 배경 오버레이 (클릭하면 모달 닫기)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 어두운 배경 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* 모달 본체 - Liquid Glass 스타일 */}
      <div
        className={[
          "relative z-10 w-full max-w-md",
          "rounded-3xl",
          "bg-white/60 dark:bg-white/[0.08]",
          "backdrop-blur-2xl",
          "border border-white/50 dark:border-white/[0.1]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)]",
          "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "px-8 py-8",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록
      >
        {/* 상단 하이라이트 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-3xl bg-gradient-to-b from-white/30 to-transparent dark:from-white/[0.04]" />

        <div className="relative">
          <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-white">
            새 프로젝트
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            시나리오 프로젝트의 제목을 입력하세요.
          </p>

          <form onSubmit={handleSubmit}>
            {/* 제목 입력 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 장편 시나리오 - 봄날"
              autoFocus
              className={[
                "w-full rounded-xl px-4 py-3 text-sm",
                "bg-white/50 dark:bg-white/[0.06]",
                "border border-white/60 dark:border-white/[0.08]",
                "text-zinc-900 placeholder-zinc-400 dark:text-white dark:placeholder-zinc-500",
                "backdrop-blur-sm",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]",
                "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                "outline-none transition-all duration-200",
                "focus:border-zinc-400/50 focus:ring-2 focus:ring-zinc-400/20",
              ].join(" ")}
            />

            {/* 에러 메시지 */}
            {error && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                {error}
              </p>
            )}

            {/* 버튼 영역 */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={[
                  "flex-1 rounded-xl py-2.5 text-sm font-medium",
                  "bg-white/50 dark:bg-white/[0.06]",
                  "border border-white/60 dark:border-white/[0.08]",
                  "text-zinc-600 dark:text-zinc-300",
                  "backdrop-blur-sm",
                  "transition-all duration-200",
                  "hover:bg-white/70 dark:hover:bg-white/[0.1]",
                ].join(" ")}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className={[
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold",
                  "bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900",
                  "backdrop-blur-sm",
                  "border border-zinc-800/50 dark:border-white/50",
                  "transition-all duration-200",
                  "hover:scale-[1.01]",
                  "active:scale-[0.99]",
                  "disabled:opacity-50 disabled:hover:scale-100",
                ].join(" ")}
              >
                {isLoading ? "만드는 중..." : "만들기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
