/**
 * 프로젝트 카드 컴포넌트
 *
 * 대시보드에 표시되는 개별 프로젝트 카드입니다.
 * - 클릭하면 해당 프로젝트의 에디터로 이동합니다.
 * - 삭제 버튼을 누르면 프로젝트가 삭제됩니다.
 *
 * Liquid Glass 스타일로 디자인되어 있습니다.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "@/app/actions/project";

// 프로젝트 데이터의 타입 정의
type Project = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export default function ProjectCard({ project }: { project: Project }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // 날짜를 읽기 쉬운 형태로 변환합니다.
  const updatedDate = new Date(project.updated_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDelete = async (e: React.MouseEvent) => {
    // 카드 클릭 이벤트가 발생하지 않도록 막습니다.
    e.stopPropagation();

    if (!confirm("이 프로젝트를 삭제하시겠습니까? 모든 문서가 함께 삭제됩니다.")) {
      return;
    }

    setIsDeleting(true);
    await deleteProject(project.id);
    router.refresh();
  };

  const handleClick = () => {
    // 프로젝트 에디터 페이지로 이동합니다.
    router.push(`/project/${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={[
        "group relative cursor-pointer",
        "rounded-2xl p-6",
        "bg-white/40 dark:bg-white/[0.04]",
        "backdrop-blur-xl",
        "border border-white/50 dark:border-white/[0.08]",
        "shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.3)]",
        "dark:shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "transition-all duration-200",
        "hover:scale-[1.01] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]",
        "active:scale-[0.99]",
        isDeleting ? "opacity-50 pointer-events-none" : "",
      ].join(" ")}
    >
      {/* 상단 하이라이트 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent dark:from-white/[0.03]" />

      <div className="relative">
        {/* 프로젝트 제목 */}
        <h3 className="font-title text-base font-bold text-zinc-900 dark:text-white">
          {project.title}
        </h3>

        {/* 수정 날짜 */}
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {updatedDate} 수정
        </p>

        {/* 삭제 버튼 - 호버 시에만 표시 */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={[
            "absolute -right-1 -top-1",
            "flex h-7 w-7 items-center justify-center",
            "rounded-lg",
            "bg-white/60 dark:bg-white/[0.08]",
            "border border-white/60 dark:border-white/[0.1]",
            "text-zinc-400 dark:text-zinc-500",
            "opacity-0 transition-all duration-200",
            "group-hover:opacity-100",
            "hover:bg-red-50 hover:text-red-500",
            "dark:hover:bg-red-500/10 dark:hover:text-red-400",
          ].join(" ")}
          title="프로젝트 삭제"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
