import type { NodeBreakPolicyMap, PageMargins } from "@/lib/editor/pageEngine/types";
import type { FontCatalogKey } from "@/lib/fonts/fontCatalog";

export type PaperPresetKey = "a4" | "us_letter";
export type ScreenplayFormatKey = "us" | "kr";

export type PaperPreset = {
  key: PaperPresetKey;
  label: string;
  pageCssSize: "A4" | "Letter";
  widthPx: number;
  heightPx: number;
  defaultMargins: PageMargins;
  defaultPageGap: number;
};

export type ScreenplayNodeVisualSpec = {
  marginTop: string;
  marginBottom: string;
  paddingLeft: number;
  paddingRight: number;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textTransform?: "none" | "uppercase";
  textAlign?: "left" | "center" | "right";
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
};

export type ScreenplayBaseVisualSpec = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  spacingScale?: number;
};

export type ScreenplayVisualSpec = {
  base: ScreenplayBaseVisualSpec;
  paragraph: ScreenplayNodeVisualSpec;
  sceneHeading: ScreenplayNodeVisualSpec;
  action: ScreenplayNodeVisualSpec;
  character: ScreenplayNodeVisualSpec;
  dialogue: ScreenplayNodeVisualSpec;
  parenthetical: ScreenplayNodeVisualSpec;
  transition: ScreenplayNodeVisualSpec;
};

export type ScreenplayFontGroup = "latin" | "digits" | "punctuation" | "hangul" | "other";
export type ScreenplayFontCoverageMap = Record<ScreenplayFontGroup, FontCatalogKey>;
export type ScreenplayLayoutMode = "us_dialogue_block" | "kr_dialogue_inline";
export type ScreenplayStyleNodeKey =
  | "sceneHeading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "paragraph";
export type ScreenplayNodeFontCoverageOverrides = Partial<
  Record<ScreenplayStyleNodeKey, Partial<ScreenplayFontCoverageMap>>
>;

export type ScreenplayDialogueLaneSpec = {
  characterStartInch: number;
  characterEndInch: number;
  speechStartInch: number;
  speechEndInch: number;
};

export type ScreenplayFormatProfile = {
  key: ScreenplayFormatKey;
  label: string;
  paperPresetKey: PaperPresetKey;
  layoutMode: ScreenplayLayoutMode;
  visual: ScreenplayVisualSpec;
  breakPolicies: NodeBreakPolicyMap;
  source: "builtin" | "custom";
  fontCoverage: ScreenplayFontCoverageMap;
  dialogueLane?: ScreenplayDialogueLaneSpec;
};

export type ScreenplayVisualOverrides = Partial<{
  base: Partial<ScreenplayBaseVisualSpec>;
  paragraph: Partial<ScreenplayNodeVisualSpec>;
  sceneHeading: Partial<ScreenplayNodeVisualSpec>;
  action: Partial<ScreenplayNodeVisualSpec>;
  character: Partial<ScreenplayNodeVisualSpec>;
  dialogue: Partial<ScreenplayNodeVisualSpec>;
  parenthetical: Partial<ScreenplayNodeVisualSpec>;
  transition: Partial<ScreenplayNodeVisualSpec>;
}>;

export type DocumentScreenplayRenderSettingsRow = {
  document_id: string;
  format_key: ScreenplayFormatKey;
  custom_format_id?: string | null;
  visual_overrides: ScreenplayVisualOverrides | null;
  break_policy_overrides: Partial<NodeBreakPolicyMap> | null;
  updated_at: string;
};

export type UserScreenplayCustomFormatRow = {
  id: string;
  user_id: string;
  name: string;
  base_format_key: ScreenplayFormatKey;
  paper_preset_key: PaperPresetKey;
  font_coverage: ScreenplayFontCoverageMap;
  base_font_size?: 14 | 16 | 18 | 20;
  node_font_coverage_overrides?: ScreenplayNodeFontCoverageOverrides;
  created_at: string;
  updated_at: string;
};

export type ResolvedScreenplaySpec = {
  formatKey: ScreenplayFormatKey;
  formatLabel: string;
  paper: PaperPreset;
  visual: ScreenplayVisualSpec;
  breakPolicies: NodeBreakPolicyMap;
  fontCoverage: ScreenplayFontCoverageMap;
  baseFontSize: 14 | 16 | 18 | 20;
  nodeFontCoverageOverrides: ScreenplayNodeFontCoverageOverrides;
  nodeEffectiveFontCoverageMap: Record<ScreenplayStyleNodeKey, ScreenplayFontCoverageMap>;
  nodeCompositeFontFamilies: Record<ScreenplayStyleNodeKey, string>;
  source: "builtin" | "custom";
  customFormatId?: string | null;
  compositeFontFamily: string;
  layoutMode: ScreenplayLayoutMode;
  dialogueLane?: ScreenplayDialogueLaneSpec;
};
