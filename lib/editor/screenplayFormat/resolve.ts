import { PAPER_PRESETS } from "./paperPresets";
import { SCREENPLAY_FORMAT_REGISTRY } from "./registry";
import { SCREENPLAY_COMPOSITE_FONT_FAMILY } from "@/lib/fonts/compositeScreenplayFont";
import type {
  DocumentScreenplayRenderSettingsRow,
  ResolvedScreenplaySpec,
  ScreenplayFormatKey,
  ScreenplayFontCoverageMap,
  ScreenplayNodeFontCoverageOverrides,
  ScreenplayStyleNodeKey,
  ScreenplayVisualOverrides,
  UserScreenplayCustomFormatRow,
} from "./types";
import type { NodeBreakPolicyMap } from "@/lib/editor/pageEngine/types";

function mergeVisualOverrides<T extends Record<string, unknown>>(
  base: T,
  overrides?: Partial<T> | null
): T {
  if (!overrides) return base;
  const result = { ...base } as T;
  for (const [k, v] of Object.entries(overrides)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof result[k as keyof T] === "object") {
      result[k as keyof T] = {
        ...(result[k as keyof T] as object),
        ...(v as object),
      } as T[keyof T];
    } else if (v !== undefined) {
      result[k as keyof T] = v as T[keyof T];
    }
  }
  return result;
}

function normalizeFormatKey(input: unknown): ScreenplayFormatKey {
  return input === "kr" ? "kr" : "us";
}

function builtinLockedSpacingScale(formatKey: ScreenplayFormatKey): number {
  return formatKey === "kr" ? 1.52 : 1.04;
}

const SCREENPLAY_STYLE_NODE_KEYS: ScreenplayStyleNodeKey[] = [
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "paragraph",
];

const NODE_ALIAS_LABELS: Record<ScreenplayStyleNodeKey, string> = {
  sceneHeading: "SceneHeading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
  paragraph: "Paragraph",
};

function coverageHash(coverage: ScreenplayFontCoverageMap) {
  return [coverage.latin, coverage.digits, coverage.punctuation, coverage.hangul, coverage.other].join("|");
}

export function resolveScreenplaySpecFromSources(args: {
  settingsRow?: Pick<DocumentScreenplayRenderSettingsRow, "format_key" | "visual_overrides" | "break_policy_overrides" | "custom_format_id"> | null;
  customFormatRow?: Pick<
    UserScreenplayCustomFormatRow,
    "id" | "base_format_key" | "font_coverage" | "base_font_size" | "node_font_coverage_overrides"
  > | null;
}): ResolvedScreenplaySpec {
  const row = args.settingsRow;
  const custom = args.customFormatRow;
  const formatKey = normalizeFormatKey(custom?.base_format_key ?? row?.format_key);
  const profile = SCREENPLAY_FORMAT_REGISTRY[formatKey];
  const paper = PAPER_PRESETS[profile.paperPresetKey];
  const mergedVisual = mergeVisualOverrides(
    profile.visual,
    (row?.visual_overrides ?? null) as ScreenplayVisualOverrides | null
  ) as typeof profile.visual;
  const breakPolicies = {
    ...profile.breakPolicies,
    ...(((row?.break_policy_overrides ?? null) as Partial<NodeBreakPolicyMap> | null) ?? {}),
  };

  const fontCoverage = custom?.font_coverage ?? profile.fontCoverage;
  const baseFontSize = ((custom?.base_font_size ?? profile.visual.base.fontSize) as 14 | 16 | 18 | 20);
  const nodeFontCoverageOverrides =
    (((custom?.node_font_coverage_overrides ?? {}) as ScreenplayNodeFontCoverageOverrides) ?? {});
  const nodeEffectiveFontCoverageMap = {} as Record<ScreenplayStyleNodeKey, ScreenplayFontCoverageMap>;
  const nodeCompositeFontFamilies = {} as Record<ScreenplayStyleNodeKey, string>;
  const aliasByCoverageHash = new Map<string, string>();
  aliasByCoverageHash.set(coverageHash(fontCoverage), SCREENPLAY_COMPOSITE_FONT_FAMILY);

  for (const nodeKey of SCREENPLAY_STYLE_NODE_KEYS) {
    const override = nodeFontCoverageOverrides[nodeKey] ?? {};
    const effectiveCoverage: ScreenplayFontCoverageMap = {
      ...fontCoverage,
      ...override,
    };
    nodeEffectiveFontCoverageMap[nodeKey] = effectiveCoverage;

    const hash = coverageHash(effectiveCoverage);
    let alias = aliasByCoverageHash.get(hash);
    if (!alias) {
      alias = `${SCREENPLAY_COMPOSITE_FONT_FAMILY} ${NODE_ALIAS_LABELS[nodeKey]}`;
      aliasByCoverageHash.set(hash, alias);
    }
    nodeCompositeFontFamilies[nodeKey] = `"${alias}", Pretendard, sans-serif`;
  }

  const visual = {
    ...mergedVisual,
    base: {
      ...mergedVisual.base,
      fontFamily: `"${SCREENPLAY_COMPOSITE_FONT_FAMILY}", Pretendard, sans-serif`,
      fontSize: baseFontSize,
    },
    paragraph: { ...mergedVisual.paragraph, fontFamily: nodeCompositeFontFamilies.paragraph },
    sceneHeading: { ...mergedVisual.sceneHeading, fontFamily: nodeCompositeFontFamilies.sceneHeading },
    action: { ...mergedVisual.action, fontFamily: nodeCompositeFontFamilies.action },
    character: { ...mergedVisual.character, fontFamily: nodeCompositeFontFamilies.character },
    dialogue: { ...mergedVisual.dialogue, fontFamily: nodeCompositeFontFamilies.dialogue },
    parenthetical: { ...mergedVisual.parenthetical, fontFamily: nodeCompositeFontFamilies.parenthetical },
    transition: { ...mergedVisual.transition, fontFamily: nodeCompositeFontFamilies.transition },
  } as typeof profile.visual;

  if (!custom) {
    visual.base = {
      ...visual.base,
      spacingScale: builtinLockedSpacingScale(profile.key),
    };
  }

  return {
    formatKey: profile.key,
    formatLabel: profile.label,
    paper,
    visual,
    breakPolicies,
    fontCoverage,
    baseFontSize,
    nodeFontCoverageOverrides,
    nodeEffectiveFontCoverageMap,
    nodeCompositeFontFamilies,
    source: custom ? "custom" : profile.source,
    customFormatId: custom?.id ?? null,
    compositeFontFamily: `"${SCREENPLAY_COMPOSITE_FONT_FAMILY}", Pretendard, sans-serif`,
    layoutMode: profile.layoutMode,
    dialogueLane: profile.dialogueLane,
  };
}

export function resolveScreenplaySpecFromSettings(
  row?: Pick<DocumentScreenplayRenderSettingsRow, "format_key" | "visual_overrides" | "break_policy_overrides" | "custom_format_id"> | null
): ResolvedScreenplaySpec {
  return resolveScreenplaySpecFromSources({ settingsRow: row ?? null });
}
