"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveScreenplaySpecFromSettings } from "@/lib/editor/screenplayFormat/resolve";
import type {
  ScreenplayFontCoverageMap,
  ScreenplayFontGroup,
  ScreenplayNodeFontCoverageOverrides,
  ScreenplayStyleNodeKey,
} from "@/lib/editor/screenplayFormat/types";
import type { FontCatalogKey } from "@/lib/fonts/fontCatalog";

type CustomRow = {
  id: string;
  user_id: string;
  name: string;
  base_format_key: "us" | "kr";
  paper_preset_key: "a4" | "us_letter";
  font_coverage: ScreenplayFontCoverageMap;
  base_font_size?: 14 | 16 | 18 | 20;
  node_font_coverage_overrides?: ScreenplayNodeFontCoverageOverrides;
  created_at: string;
  updated_at: string;
};

const BASE_FONT_SIZE_OPTIONS = new Set([14, 16, 18, 20] as const);
const NODE_KEYS: ScreenplayStyleNodeKey[] = [
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "paragraph",
];
const FONT_GROUP_KEYS: ScreenplayFontGroup[] = ["latin", "digits", "punctuation", "hangul", "other"];
const FONT_KEYS = new Set<FontCatalogKey>(["courier_prime", "kopub_batang", "pretendard"]);

function isNodeKey(value: string): value is ScreenplayStyleNodeKey {
  return (NODE_KEYS as string[]).includes(value);
}

function isFontGroupKey(value: string): value is ScreenplayFontGroup {
  return (FONT_GROUP_KEYS as string[]).includes(value);
}

export async function listUserScreenplayCustomFormatsAction() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { data: [], error: "로그인이 필요합니다." };
  const { data, error } = await supabase
    .from("user_screenplay_custom_formats")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });
  return { data: ((data ?? []) as CustomRow[]), error: error?.message ?? null };
}

export async function createCustomScreenplayFormatFromCurrentAction(args: { documentId: string; name?: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: "로그인이 필요합니다.", data: null };

  const { data: settings } = await supabase
    .from("document_screenplay_render_settings")
    .select("format_key,visual_overrides,break_policy_overrides")
    .eq("document_id", args.documentId)
    .maybeSingle();

  const spec = resolveScreenplaySpecFromSettings((settings as never) ?? null);
  const now = new Date().toISOString();
  const name = args.name?.trim() || `${spec.formatLabel} 커스텀 ${now.slice(0, 16).replace(/[:T]/g, "-")}`;

  const { data, error } = await supabase
    .from("user_screenplay_custom_formats")
    .insert({
      user_id: auth.user.id,
      name,
      base_format_key: spec.formatKey,
      paper_preset_key: spec.paper.key,
      font_coverage: spec.fontCoverage,
      base_font_size: spec.baseFontSize,
      node_font_coverage_overrides: {},
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message, data: null };

  const attach = await supabase
    .from("document_screenplay_render_settings")
    .upsert({
      document_id: args.documentId,
      format_key: spec.formatKey,
      custom_format_id: data.id,
      updated_at: now,
    }, { onConflict: "document_id" });

  if (attach.error) return { success: false, error: attach.error.message, data: null };

  return { success: true, error: null, data: data as CustomRow };
}

export async function updateCustomScreenplayFontCoverageAction(args: {
  customFormatId: string;
  fontCoverage: ScreenplayFontCoverageMap;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: "로그인이 필요합니다." };
  const { error } = await supabase
    .from("user_screenplay_custom_formats")
    .update({ font_coverage: args.fontCoverage, updated_at: new Date().toISOString() })
    .eq("id", args.customFormatId)
    .eq("user_id", auth.user.id);
  return { success: !error, error: error?.message ?? null };
}

export async function updateCustomScreenplayBaseFontSizeAction(args: {
  customFormatId: string;
  baseFontSize: 14 | 16 | 18 | 20;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: "로그인이 필요합니다." };
  if (!BASE_FONT_SIZE_OPTIONS.has(args.baseFontSize)) {
    return { success: false, error: "허용되지 않은 폰트 사이즈입니다." };
  }

  const { error } = await supabase
    .from("user_screenplay_custom_formats")
    .update({ base_font_size: args.baseFontSize, updated_at: new Date().toISOString() })
    .eq("id", args.customFormatId)
    .eq("user_id", auth.user.id);

  return { success: !error, error: error?.message ?? null };
}

export async function updateCustomScreenplayNodeFontCoverageOverrideAtKeyAction(args: {
  customFormatId: string;
  node: ScreenplayStyleNodeKey;
  group: ScreenplayFontGroup;
  fontKey: FontCatalogKey | null;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: "로그인이 필요합니다." };
  if (!isNodeKey(args.node)) return { success: false, error: "허용되지 않은 노드입니다." };
  if (!isFontGroupKey(args.group)) return { success: false, error: "허용되지 않은 문자군입니다." };
  if (args.fontKey !== null && !FONT_KEYS.has(args.fontKey)) {
    return { success: false, error: "허용되지 않은 폰트입니다." };
  }

  const { data: row, error: rowError } = await supabase
    .from("user_screenplay_custom_formats")
    .select("id,node_font_coverage_overrides")
    .eq("id", args.customFormatId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (rowError || !row) {
    return { success: false, error: rowError?.message ?? "커스텀 포맷을 찾을 수 없습니다." };
  }

  const nextOverrides = {
    ...(((row.node_font_coverage_overrides ?? {}) as ScreenplayNodeFontCoverageOverrides) ?? {}),
  } as ScreenplayNodeFontCoverageOverrides;
  const nodeOverrides = { ...(nextOverrides[args.node] ?? {}) } as Partial<ScreenplayFontCoverageMap>;

  if (args.fontKey === null) {
    delete nodeOverrides[args.group];
  } else {
    nodeOverrides[args.group] = args.fontKey;
  }

  if (Object.keys(nodeOverrides).length === 0) {
    delete nextOverrides[args.node];
  } else {
    nextOverrides[args.node] = nodeOverrides;
  }

  const { error } = await supabase
    .from("user_screenplay_custom_formats")
    .update({ node_font_coverage_overrides: nextOverrides, updated_at: new Date().toISOString() })
    .eq("id", args.customFormatId)
    .eq("user_id", auth.user.id);

  return { success: !error, error: error?.message ?? null };
}

export async function attachDocumentToCustomScreenplayFormatAction(args: { documentId: string; customFormatId: string }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: "로그인이 필요합니다." };

  const { data: custom, error: customError } = await supabase
    .from("user_screenplay_custom_formats")
    .select("id, base_format_key")
    .eq("id", args.customFormatId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (customError || !custom) return { success: false, error: customError?.message ?? "커스텀 포맷을 찾을 수 없습니다." };

  const { error } = await supabase
    .from("document_screenplay_render_settings")
    .upsert({
      document_id: args.documentId,
      custom_format_id: custom.id,
      format_key: custom.base_format_key,
      updated_at: new Date().toISOString(),
    }, { onConflict: "document_id" });

  return { success: !error, error: error?.message ?? null };
}
