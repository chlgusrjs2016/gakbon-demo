/**
 * 인치 눈금자 (Ruler)
 *
 * A4 용지 표준 폭(8.27인치 = 794px @ 96dpi)에 맞춘 눈금자입니다.
 * 레퍼런스처럼 '자' 형태가 드러나도록:
 * - 배경 바가 있고
 * - 눈금이 위에서 아래로 내려오며
 * - 인치 라벨이 눈금 사이에 배치됩니다
 */
"use client";

import { PX_PER_INCH } from "@/lib/editor/pageEngine/config";

const RULER_HEIGHT = 28;

type TickMark = {
  position: number;
  height: number;
  label?: string;
};

function generateTicks(totalInches: number): TickMark[] {
  const ticks: TickMark[] = [];

  for (let i = 0; i <= totalInches * 8; i++) {
    const inch = i / 8;
    const position = inch * PX_PER_INCH;
    const isFullInch = i % 8 === 0;
    const isHalfInch = i % 4 === 0 && !isFullInch;
    const isQuarterInch = i % 2 === 0 && !isHalfInch && !isFullInch;

    if (isFullInch) {
      ticks.push({
        position,
        height: 14,
        label: inch > 0 && inch < totalInches ? String(Math.round(inch)) : undefined,
      });
    } else if (isHalfInch) {
      ticks.push({ position, height: 10 });
    } else if (isQuarterInch) {
      ticks.push({ position, height: 6 });
    } else {
      ticks.push({ position, height: 4 });
    }
  }

  return ticks;
}

export default function Ruler({
  widthPx,
  totalInches,
  leftMarginPx,
  rightMarginPx,
}: {
  widthPx: number;
  totalInches: number;
  leftMarginPx: number;
  rightMarginPx: number;
}) {
  const ticks = generateTicks(totalInches);
  return (
    <div
      className={[
        "relative mx-auto select-none",
        "bg-gray-50 dark:bg-zinc-800/60",
        "border border-zinc-200/80 dark:border-zinc-700/60",
        "rounded-t-sm",
      ].join(" ")}
      style={{ width: widthPx, height: RULER_HEIGHT }}
    >
      {/* 눈금 (위에서 아래로) */}
      {ticks.map((tick, i) => (
        <div key={i} className="absolute top-0" style={{ left: tick.position }}>
          <div
            className="w-px bg-zinc-400 dark:bg-zinc-500"
            style={{ height: tick.height }}
          />
        </div>
      ))}

      {/* 인치 라벨 (눈금 사이, 하단에 배치) */}
      {ticks
        .filter((t) => t.label)
        .map((tick) => (
          <span
            key={tick.label}
            className="absolute text-[9px] font-medium text-zinc-500 dark:text-zinc-400"
            style={{
              bottom: 3,
              left: tick.position,
              transform: "translateX(-50%)",
            }}
          >
            {tick.label}
          </span>
        ))}

      {/* 하단 경계선 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-300 dark:bg-zinc-600" />

      {/* 좌우 마진 인디케이터 (삼각형) */}
      <div
        className="absolute bottom-0"
        style={{ left: leftMarginPx }}
      >
        <div className="absolute bottom-0 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-zinc-400 dark:border-b-zinc-500" />
      </div>
      <div
        className="absolute bottom-0"
        style={{ left: widthPx - rightMarginPx }}
      >
        <div className="absolute bottom-0 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[5px] border-l-transparent border-r-transparent border-b-zinc-400 dark:border-b-zinc-500" />
      </div>
    </div>
  );
}
