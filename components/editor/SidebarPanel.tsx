"use client";

import type { ReactNode } from "react";

const PANEL_OUTER_CLASS = "flex h-full w-[360px] shrink-0 p-2";
const PANEL_SHELL_CLASS = [
  "flex flex-1 flex-col overflow-hidden rounded-2xl",
  "bg-white/30 dark:bg-white/[0.04]",
  "backdrop-blur-2xl",
  "border border-white/60 dark:border-white/[0.1]",
  "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
].join(" ");
const PANEL_HEADER_CLASS =
  "flex min-h-[52px] items-center justify-between gap-2 border-b border-white/40 px-4 py-3 dark:border-white/[0.06]";
const PANEL_HEADER_TITLE_CLASS =
  "flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300";
const PANEL_BODY_CLASS = "flex-1 overflow-y-auto";
const PANEL_FOOTER_CLASS = "border-t border-white/40 px-4 py-2.5 dark:border-white/[0.06]";

type SidebarPanelProps = {
  side?: "left" | "right";
  widthClassName?: string;
  title: string;
  icon: ReactNode;
  headerActions?: ReactNode;
  bodyClassName?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export default function SidebarPanel({
  side = "left",
  widthClassName = "w-[360px]",
  title,
  icon,
  headerActions,
  bodyClassName,
  footer,
  children,
}: SidebarPanelProps) {
  void side;
  return (
    <div className={[PANEL_OUTER_CLASS, widthClassName].join(" ")}>
      <aside className={PANEL_SHELL_CLASS}>
        <div className={PANEL_HEADER_CLASS}>
          <div className={PANEL_HEADER_TITLE_CLASS}>
            <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
            <span>{title}</span>
          </div>
          {headerActions ? <div className="flex shrink-0 items-center gap-1.5">{headerActions}</div> : null}
        </div>
        <div className={[PANEL_BODY_CLASS, bodyClassName ?? ""].join(" ").trim()}>{children}</div>
        {footer ? <div className={PANEL_FOOTER_CLASS}>{footer}</div> : null}
      </aside>
    </div>
  );
}
