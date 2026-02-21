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

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import { duplicateProject, moveProjectToTrash, renameProject } from "@/app/actions/project";

// 프로젝트 데이터의 타입 정의
type Project = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export default function ProjectCard({ project }: { project: Project }) {
  const [isWorking, setIsWorking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMenu]);

  // 날짜를 읽기 쉬운 형태로 변환합니다.
  const updatedDate = new Date(project.updated_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const next = window.prompt("프로젝트 이름 변경", project.title);
    if (!next?.trim()) return;
    setIsWorking(true);
    const result = await renameProject(project.id, next);
    setIsWorking(false);
    if (!result.success) {
      window.alert(result.error ?? "이름 변경에 실패했습니다.");
      return;
    }
    router.refresh();
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsWorking(true);
    const result = await duplicateProject(project.id);
    setIsWorking(false);
    if (!result.success) {
      window.alert(result.error ?? "프로젝트 복제에 실패했습니다.");
      return;
    }
    router.refresh();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!confirm("이 프로젝트를 휴지통으로 이동하시겠습니까?")) {
      return;
    }

    setIsWorking(true);
    await moveProjectToTrash(project.id);
    setIsWorking(false);
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
        isWorking ? "opacity-50 pointer-events-none" : "",
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

        <div ref={menuRef} className="absolute -right-1 -top-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-lg",
              "bg-white/60 dark:bg-white/[0.08]",
              "border border-white/60 dark:border-white/[0.1]",
              "text-zinc-400 dark:text-zinc-500",
              "opacity-0 transition-all duration-200 group-hover:opacity-100",
              "hover:bg-white/90 hover:text-zinc-600 dark:hover:bg-white/[0.14] dark:hover:text-zinc-300",
            ].join(" ")}
            title="프로젝트 메뉴"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {showMenu && (
            <div
              className={[
                "absolute right-0 top-8 z-[120] min-w-[130px] rounded-xl py-1.5",
                "bg-white/40 dark:bg-zinc-900/40",
                "backdrop-blur-3xl saturate-150",
                "border border-white/60 dark:border-white/[0.1]",
                "shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_0.5px_0_rgba(255,255,255,0.5)]",
                "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
              ].join(" ")}
            >
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-zinc-600 transition-all duration-100 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
                onClick={handleRename}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>이름 변경</span>
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-zinc-600 transition-all duration-100 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
                onClick={handleDuplicate}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>복제</span>
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-rose-600 transition-all duration-100 hover:bg-rose-50/80 dark:text-rose-400 dark:hover:bg-rose-500/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
