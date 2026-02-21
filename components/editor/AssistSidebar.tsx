"use client";

type AssistSidebarProps = {
  documentId?: string;
  projectId?: string;
};

export default function AssistSidebar(_: AssistSidebarProps) {
  void _;
  return (
    <aside className="flex h-full w-[360px] flex-col border-l border-zinc-200/70 bg-white/80 p-3 backdrop-blur dark:border-white/[0.08] dark:bg-zinc-950/70">
      <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 text-xs text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-900/55 dark:text-zinc-400">
        어시스트 기능은 현재 비활성화되어 있습니다.
      </div>
    </aside>
  );
}
