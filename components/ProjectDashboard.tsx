/**
 * 프로젝트 대시보드 컴포넌트 (Client Component)
 *
 * "use client" = 브라우저에서 실행됩니다.
 * 모달을 열고 닫는 상태(state)를 관리해야 하므로 클라이언트 컴포넌트여야 합니다.
 *
 * 서버에서 가져온 프로젝트 목록을 props로 받아서 표시합니다.
 */
"use client";

import { useState } from "react";
import ProjectCard from "./ProjectCard";
import NewProjectModal from "./NewProjectModal";

// 프로젝트 데이터의 타입 정의
type Project = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export default function ProjectDashboard({
  projects,
}: {
  projects: Project[];
}) {
  // 모달이 열려있는지 여부
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* 헤더: 제목 + 새 프로젝트 버튼 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            프로젝트
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            시나리오 프로젝트를 만들고 관리하세요.
          </p>
        </div>

        {/* 새 프로젝트 버튼 */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={[
            "flex items-center gap-2",
            "rounded-xl px-4 py-2.5 text-sm font-semibold",
            "bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900",
            "backdrop-blur-sm",
            "border border-zinc-800/50 dark:border-white/50",
            "shadow-[0_4px_16px_rgba(0,0,0,0.1)]",
            "dark:shadow-[0_4px_16px_rgba(255,255,255,0.05)]",
            "transition-all duration-200",
            "hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]",
            "active:scale-[0.98]",
          ].join(" ")}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          새 프로젝트
        </button>
      </div>

      {/* 프로젝트 목록 또는 빈 상태 */}
      {projects.length > 0 ? (
        // 프로젝트가 있으면 그리드로 표시
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        // 프로젝트가 없으면 빈 상태 표시
        <div
          className={[
            "flex flex-1 flex-col items-center justify-center",
            "rounded-3xl py-20",
            "bg-white/30 dark:bg-white/[0.04]",
            "backdrop-blur-xl",
            "border border-dashed border-zinc-300/50 dark:border-white/[0.08]",
          ].join(" ")}
        >
          <div
            className={[
              "mb-6 flex h-16 w-16 items-center justify-center",
              "rounded-2xl",
              "bg-white/50 dark:bg-white/[0.06]",
              "backdrop-blur-sm",
              "border border-white/60 dark:border-white/[0.08]",
              "shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
            ].join(" ")}
          >
            <svg
              className="h-8 w-8 text-zinc-400 dark:text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            아직 프로젝트가 없습니다
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            위의 &quot;새 프로젝트&quot; 버튼을 눌러 시작하세요
          </p>
        </div>
      )}

      {/* 새 프로젝트 생성 모달 */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
