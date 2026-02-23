"use client";

import { useState } from "react";
import { CopyPlus, Palette } from "lucide-react";
import { FONT_CATALOG, FONT_CATALOG_OPTIONS, type FontCatalogKey } from "@/lib/fonts/fontCatalog";
import SidebarPanel from "@/components/editor/SidebarPanel";
import type {
  ScreenplayFontCoverageMap,
  ScreenplayFontGroup,
  ScreenplayNodeFontCoverageOverrides,
  ScreenplayStyleNodeKey,
} from "@/lib/editor/screenplayFormat/types";

const FONT_SIZE_OPTIONS = [14, 16, 18, 20] as const;
const LINE_SPACING_SCALE_OPTIONS = [1.04, 1.2, 1.36, 1.52] as const;
const LINE_SPACING_CUSTOM_VALUE = "__custom__";

const FONT_GROUP_OPTIONS: Array<{ key: ScreenplayFontGroup; label: string }> = [
  { key: "latin", label: "영어(라틴)" },
  { key: "digits", label: "숫자" },
  { key: "punctuation", label: "기호" },
  { key: "hangul", label: "한국어" },
  { key: "other", label: "그외 문자" },
];

const NODE_OPTIONS: Array<{ key: ScreenplayStyleNodeKey; label: string }> = [
  { key: "sceneHeading", label: "씬 헤딩" },
  { key: "action", label: "액션" },
  { key: "character", label: "등장인물" },
  { key: "dialogue", label: "대사" },
  { key: "parenthetical", label: "괄호지시" },
  { key: "transition", label: "트랜지션" },
  { key: "paragraph", label: "문단" },
];

function sampleTextForGroup(group: ScreenplayFontGroup) {
  switch (group) {
    case "latin":
      return "The quick brown fox";
    case "digits":
      return "0123456789";
    case "punctuation":
      return "()[]{}.,!?;:-";
    case "hangul":
      return "가나다라마바사";
    case "other":
      return "漢字 テスト";
    default:
      return "Sample";
  }
}

function truncateToTwoDecimals(value: number) {
  return Math.floor(value * 100) / 100;
}

function normalizeLineSpacingScale(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 1;
  return truncateToTwoDecimals(value);
}

function parseLineSpacingScale(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return truncateToTwoDecimals(parsed);
}

export default function StyleSidebar({
  isScreenplay,
  fontCoverage,
  baseFontSize,
  lineSpacingScale,
  nodeFontCoverageOverrides,
  builtinLocked,
  activeFormatLabel,
  onCloneToCustom,
  onChangeBaseFontSize,
  onChangeFontCoverage,
  onChangeLineSpacingScale,
  onChangeNodeFontCoverageAtKey,
}: {
  isScreenplay: boolean;
  fontCoverage: ScreenplayFontCoverageMap | null;
  baseFontSize: 14 | 16 | 18 | 20 | null;
  lineSpacingScale: number;
  nodeFontCoverageOverrides: ScreenplayNodeFontCoverageOverrides | null;
  builtinLocked: boolean;
  activeFormatLabel?: string;
  onCloneToCustom: () => void;
  onChangeBaseFontSize: (next: 14 | 16 | 18 | 20) => void;
  onChangeFontCoverage: (next: ScreenplayFontCoverageMap) => void;
  onChangeLineSpacingScale: (next: number) => void;
  onChangeNodeFontCoverageAtKey: (
    node: ScreenplayStyleNodeKey,
    group: ScreenplayFontGroup,
    fontKey: FontCatalogKey | null
  ) => void;
}) {
  const normalizedLineSpacingScale = normalizeLineSpacingScale(lineSpacingScale);
  const presetLineSpacingValue = LINE_SPACING_SCALE_OPTIONS.find((v) => v === normalizedLineSpacingScale);
  const [selectedGlobalGroup, setSelectedGlobalGroup] = useState<ScreenplayFontGroup>("hangul");
  const [selectedNode, setSelectedNode] = useState<ScreenplayStyleNodeKey>("character");
  const [selectedNodeGroup, setSelectedNodeGroup] = useState<ScreenplayFontGroup>("hangul");
  const [lineSpacingDraft, setLineSpacingDraft] = useState(String(normalizedLineSpacingScale));
  const [isCustomLineSpacingMode, setIsCustomLineSpacingMode] = useState<boolean>(
    presetLineSpacingValue == null
  );
  const lineSpacingSelectValue =
    isCustomLineSpacingMode || presetLineSpacingValue == null
      ? LINE_SPACING_CUSTOM_VALUE
      : String(presetLineSpacingValue);

  const commitLineSpacingDraft = () => {
    const parsed = parseLineSpacingScale(lineSpacingDraft);
    if (parsed == null) {
      setLineSpacingDraft(String(normalizedLineSpacingScale));
      return;
    }
    setLineSpacingDraft(String(parsed));
    if (parsed !== normalizedLineSpacingScale) {
      onChangeLineSpacingScale(parsed);
    }
  };

  if (!isScreenplay) {
    return (
      <SidebarPanel side="left" title="스타일" icon={<Palette className="h-4 w-4" />} bodyClassName="p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">document 타입에서는 폰트 섹션을 지원하지 않습니다.</p>
      </SidebarPanel>
    );
  }

  const inheritedFontKey =
    (fontCoverage?.[selectedNodeGroup] ?? "pretendard") as FontCatalogKey;
  const nodeOverrideFontKey =
    (nodeFontCoverageOverrides?.[selectedNode]?.[selectedNodeGroup] ?? null) as FontCatalogKey | null;
  const nodeEffectiveFontKey = (nodeOverrideFontKey ?? inheritedFontKey) as FontCatalogKey;
  const isInherited = nodeOverrideFontKey == null;
  const globalPreviewFontKey = (fontCoverage?.[selectedGlobalGroup] ?? "pretendard") as FontCatalogKey;
  const globalPreviewFamily = FONT_CATALOG[globalPreviewFontKey]?.cssFamily ?? "Pretendard";
  const nodePreviewFamily = FONT_CATALOG[nodeEffectiveFontKey]?.cssFamily ?? "Pretendard";

  return (
    <SidebarPanel side="left" title="스타일" icon={<Palette className="h-4 w-4" />} bodyClassName="px-4 py-4">
      <section className="mb-4 rounded-xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">현재 포맷</div>
        <div className="mt-1 text-xs text-zinc-700 dark:text-zinc-200">{activeFormatLabel ?? "US"}</div>
        {builtinLocked && (
          <div className="mt-3 rounded-lg border border-amber-200/70 bg-amber-50/70 p-3 text-[11px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <p>내장 포맷은 수정할 수 없습니다. 커스텀으로 복제해서 편집하세요.</p>
            <button
              type="button"
              onClick={onCloneToCustom}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-[11px] text-white hover:bg-amber-700"
            >
              <CopyPlus className="h-3.5 w-3.5" />
              커스텀으로 복제
            </button>
          </div>
        )}
      </section>

      <section className="mb-4 rounded-xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
        <div className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">폰트 사이즈</div>
        <select
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
          disabled={builtinLocked || baseFontSize == null}
          value={baseFontSize ?? 16}
          onChange={(e) => onChangeBaseFontSize(Number(e.target.value) as 14 | 16 | 18 | 20)}
        >
          {FONT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
      </section>

      <section className="mb-4 rounded-xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
        <div className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">줄간격</div>
        <select
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
          disabled={builtinLocked}
          value={lineSpacingSelectValue}
          onChange={(e) => {
            if (builtinLocked) return;
            const nextValue = e.target.value;
            if (nextValue === LINE_SPACING_CUSTOM_VALUE) {
              setIsCustomLineSpacingMode(true);
              setLineSpacingDraft(String(normalizedLineSpacingScale));
              return;
            }
            setIsCustomLineSpacingMode(false);
            const parsed = Number(nextValue);
            if (!Number.isFinite(parsed)) return;
            setLineSpacingDraft(String(parsed));
            onChangeLineSpacingScale(parsed);
          }}
        >
          {LINE_SPACING_SCALE_OPTIONS.map((value) => (
            <option key={value} value={String(value)}>
              {String(value)}
            </option>
          ))}
          <option value={LINE_SPACING_CUSTOM_VALUE}>직접 작성</option>
        </select>
        {lineSpacingSelectValue === LINE_SPACING_CUSTOM_VALUE && (
          <input
            type="text"
            inputMode="decimal"
            className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
            disabled={builtinLocked}
            value={lineSpacingDraft}
            onChange={(e) => setLineSpacingDraft(e.target.value)}
            onBlur={commitLineSpacingDraft}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              commitLineSpacingDraft();
            }}
            placeholder="예: 1.25"
          />
        )}
        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          {builtinLocked
            ? "내장 포맷은 줄간격이 고정됩니다. 커스텀 포맷에서만 변경할 수 있습니다."
            : "직접 작성 값은 소수점 둘째자리까지 반영하며, 그 아래 자리는 절삭합니다."}
        </p>
      </section>

      <section className="space-y-3">
        <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <div className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">폰트</div>
          <div className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">전체 노드의 폰트 변경</div>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
              value={selectedGlobalGroup}
              onChange={(e) => setSelectedGlobalGroup(e.target.value as ScreenplayFontGroup)}
              disabled={builtinLocked || !fontCoverage}
            >
              {FONT_GROUP_OPTIONS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
            <select
              className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
              disabled={builtinLocked || !fontCoverage}
              value={fontCoverage?.[selectedGlobalGroup] ?? "pretendard"}
              onChange={(e) => {
                if (!fontCoverage) return;
                onChangeFontCoverage({
                  ...fontCoverage,
                  [selectedGlobalGroup]: e.target.value as FontCatalogKey,
                });
              }}
            >
              {FONT_CATALOG_OPTIONS.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
            </select>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            현재 적용: {FONT_CATALOG[globalPreviewFontKey]?.label ?? "Pretendard"}
          </p>
          <div className="mt-2 rounded-md border border-zinc-200/70 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-200">
            <div className="mb-1 text-[10px] text-zinc-500 dark:text-zinc-400">프리뷰</div>
            <div style={{ fontFamily: globalPreviewFamily }}>
              {sampleTextForGroup(selectedGlobalGroup)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <div className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">각 노드의 폰트 변경</div>
          <div className="grid grid-cols-1 gap-2">
            <select
              className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value as ScreenplayStyleNodeKey)}
              disabled={builtinLocked}
            >
              {NODE_OPTIONS.map((n) => <option key={n.key} value={n.key}>{n.label}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
                value={selectedNodeGroup}
                onChange={(e) => setSelectedNodeGroup(e.target.value as ScreenplayFontGroup)}
                disabled={builtinLocked}
              >
                {FONT_GROUP_OPTIONS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
              <select
                className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-200"
                disabled={builtinLocked}
                value={nodeEffectiveFontKey}
                onChange={(e) => {
                  onChangeNodeFontCoverageAtKey(selectedNode, selectedNodeGroup, e.target.value as FontCatalogKey);
                }}
              >
                {FONT_CATALOG_OPTIONS.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            {isInherited ? (
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300">
                상속
              </span>
            ) : (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                사용자 지정
              </span>
            )}
            <span className="text-zinc-500 dark:text-zinc-400">
              현재 상속값: {FONT_CATALOG[inheritedFontKey]?.label ?? "Pretendard"}
            </span>
          </div>
          <div className="mt-2 rounded-md border border-zinc-200/70 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-200">
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span>프리뷰</span>
              <span>{NODE_OPTIONS.find((n) => n.key === selectedNode)?.label}</span>
            </div>
            <div style={{ fontFamily: nodePreviewFamily }}>
              {sampleTextForGroup(selectedNodeGroup)}
            </div>
          </div>
          <button
            type="button"
            disabled={builtinLocked || isInherited}
            onClick={() => onChangeNodeFontCoverageAtKey(selectedNode, selectedNodeGroup, null)}
            className="mt-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-600 disabled:opacity-50 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300"
          >
            상속으로 되돌리기
          </button>
        </div>
      </section>
    </SidebarPanel>
  );
}
