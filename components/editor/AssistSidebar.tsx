"use client";

import { Sparkles } from "lucide-react";
import SidebarPanel from "@/components/editor/SidebarPanel";

type AssistSidebarProps = {
  documentId?: string;
  projectId?: string;
};

export default function AssistSidebar(_: AssistSidebarProps) {
  void _;
  return (
    <SidebarPanel side="right" title="어시스트" icon={<Sparkles className="h-4 w-4" />} bodyClassName="p-3">
      <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 text-xs text-zinc-500 dark:border-white/[0.08] dark:bg-zinc-900/55 dark:text-zinc-400">
        어시스트 기능은 현재 비활성화되어 있습니다.
      </div>
    </SidebarPanel>
  );
}
