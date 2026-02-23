/**
 * GlassDropdown — 범용 Liquid Glass 스타일 드롭다운
 *
 * 앱 전체에서 사용할 수 있는 재사용 가능 드롭다운입니다.
 * backdrop-blur + 반투명 배경으로 뒤 화면이 비쳐 보이는 유리 효과를 제공합니다.
 *
 * 트리거 폭은 가장 긴 옵션 텍스트에 맞춰 고정됩니다.
 * 화살표 아이콘은 항상 우측에 고정됩니다.
 */
"use client";

import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/* ── 타입 ── */
export type GlassDropdownOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type GlassDropdownProps = {
  /** 현재 선택된 값 */
  value: string;
  /** 옵션 목록 */
  options: GlassDropdownOption[];
  /** 값 변경 콜백 */
  onChange: (value: string) => void;
  /** 트리거 앞에 표시할 아이콘/요소 (선택) */
  triggerPrefix?: ReactNode;
  /** 드롭다운 메뉴 최소 너비 (기본 160px) */
  menuWidth?: number;
  /** 트리거 사이즈: sm(작게) / md(기본) */
  size?: "sm" | "md";
  /** 메뉴 정렬: left / center / right */
  align?: "left" | "center" | "right";
  /** 트리거 버튼 최소 너비 (고정 폭) — 미지정 시 자동 계산 */
  triggerMinWidth?: number;
  /** 트리거에 고정 라벨 표시 (지정 시 선택값 대신 이 텍스트 표시) */
  triggerLabel?: string;
  /** 트리거 mouse down 시 기본 동작 방지 (focus 이동 방지용) */
  preventDefaultOnTriggerMouseDown?: boolean;
  /** 메뉴 아이템 mouse down 시 기본 동작 방지 (editor selection 보존용) */
  preventDefaultOnItemMouseDown?: boolean;
};

/**
 * 가장 긴 라벨의 대략적인 폭을 계산합니다.
 * 한글: ~12px/글자, 영문: ~7px/글자 (text-xs 기준 추정)
 */
function estimateMaxLabelWidth(
  options: GlassDropdownOption[],
  fontSize: "sm" | "md"
): number {
  const charWidth = fontSize === "sm" ? 6.5 : 7;
  const koreanCharWidth = fontSize === "sm" ? 11 : 12;

  let maxWidth = 0;
  for (const opt of options) {
    let width = 0;
    for (const ch of opt.label) {
      // 한글 범위 체크
      const code = ch.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7af) {
        width += koreanCharWidth;
      } else {
        width += charWidth;
      }
    }
    if (width > maxWidth) maxWidth = width;
  }

  // 아이콘(14px) + gap(8px) + chevron(12px) + gap(8px) + 좌우패딩(24px) + 여유(4px)
  const hasIcons = options.some((o) => o.icon);
  const iconSpace = hasIcons ? 22 : 0;
  const chevronSpace = 28; // chevron + gap + 여유
  const padding = fontSize === "sm" ? 16 : 24;

  return Math.ceil(maxWidth + iconSpace + chevronSpace + padding);
}

export default function GlassDropdown({
  value,
  options,
  onChange,
  triggerPrefix,
  menuWidth = 160,
  size = "md",
  align = "center",
  triggerMinWidth,
  triggerLabel,
  preventDefaultOnTriggerMouseDown = false,
  preventDefaultOnItemMouseDown = false,
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  /* ── 가장 긴 라벨 기준 폭 계산 ── */
  const autoWidth = useMemo(
    () => estimateMaxLabelWidth(options, size),
    [options, size]
  );
  const fixedWidth = triggerMinWidth ?? autoWidth;

  /* ── 외부 클릭 시 닫기 ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const triggerEl = triggerRef.current;
      if (!triggerEl) return;
      const rect = triggerEl.getBoundingClientRect();
      const minWidth = Math.max(menuWidth, fixedWidth);
      const marginTop = 6;
      let left = rect.left;
      if (align === "center") left = rect.left + rect.width / 2 - minWidth / 2;
      if (align === "right") left = rect.right - minWidth;
      const maxLeft = window.innerWidth - minWidth - 8;
      left = Math.max(8, Math.min(left, maxLeft));

      setMenuPosition({
        top: rect.bottom + marginTop,
        left,
        minWidth,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, align, menuWidth, fixedWidth]);

  /* ── ESC 키로 닫기 ── */
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  /* ── 사이즈별 트리거 패딩 ── */
  const triggerPad = size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  const triggerText = size === "sm" ? "text-[11px]" : "text-xs";

  const menu = isOpen && menuPosition
    ? createPortal(
        <div
          ref={menuRef}
          className={[
            "fixed z-[2000] rounded-xl py-1.5",
            "bg-white/40 dark:bg-zinc-900/40",
            "backdrop-blur-3xl saturate-150",
            "border border-white/60 dark:border-white/[0.1]",
            "shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_0.5px_0_rgba(255,255,255,0.5)]",
            "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
          ].join(" ")}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            minWidth: menuPosition.minWidth,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => {
                  if (preventDefaultOnItemMouseDown) e.preventDefault();
                }}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-2.5 px-3 py-2 text-xs",
                  "transition-all duration-100",
                  isSelected
                    ? "bg-white/50 dark:bg-white/[0.1] font-semibold text-zinc-900 dark:text-white"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {opt.icon && (
                  <span
                    className={
                      isSelected
                        ? "text-zinc-700 dark:text-zinc-200"
                        : "text-zinc-400 dark:text-zinc-500"
                    }
                  >
                    {opt.icon}
                  </span>
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className={isOpen ? "relative z-[150]" : "relative"}>
      {/* ── 트리거 버튼 ── */}
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={(e) => {
          if (preventDefaultOnTriggerMouseDown) e.preventDefault();
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ minWidth: fixedWidth }}
        className={[
          `flex items-center gap-2 rounded-lg ${triggerPad}`,
          "bg-white/30 dark:bg-white/[0.05]",
          "backdrop-blur-2xl",
          "border border-white/50 dark:border-white/[0.08]",
          "shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]",
          "dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
          `${triggerText} font-medium text-zinc-700 dark:text-zinc-200`,
          "transition-all duration-150",
          "hover:bg-white/50 dark:hover:bg-white/[0.08]",
          "active:scale-[0.98]",
          isOpen
            ? "ring-2 ring-zinc-300/40 dark:ring-white/10 bg-white/50 dark:bg-white/[0.08]"
            : "",
        ].join(" ")}
      >
        {triggerPrefix}
        {!triggerLabel && selected.icon && (
          <span className="text-zinc-500 dark:text-zinc-400">
            {selected.icon}
          </span>
        )}
        <span className="flex-1 text-left">{triggerLabel ?? selected.label}</span>
        <ChevronDown
          className={`ml-auto h-3 w-3 shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </div>
  );
}
