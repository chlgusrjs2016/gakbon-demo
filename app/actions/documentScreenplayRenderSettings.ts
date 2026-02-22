"use server";

import { createClient } from "@/lib/supabase/server";
import type { NodeBreakPolicyMap } from "@/lib/editor/pageEngine/types";
import type {
  DocumentScreenplayRenderSettingsRow,
  ScreenplayFormatKey,
  ScreenplayVisualOverrides,
} from "@/lib/editor/screenplayFormat/types";

type Row = DocumentScreenplayRenderSettingsRow;

type Patch = {
  formatKey?: ScreenplayFormatKey;
  customFormatId?: string | null;
  visualOverrides?: ScreenplayVisualOverrides;
  breakPolicyOverrides?: Partial<NodeBreakPolicyMap>;
};

export async function getDocumentScreenplayRenderSettings(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_screenplay_render_settings")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: (data as Row | null) ?? null, error: null };
}

export async function upsertDocumentScreenplayRenderSettings(documentId: string, patch: Patch) {
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("document_screenplay_render_settings")
    .select("*")
    .eq("document_id", documentId)
    .maybeSingle();

  if (currentError) {
    return { success: false, error: currentError.message, data: null };
  }

  const nextRow = {
    document_id: documentId,
    format_key: patch.formatKey ?? (current?.format_key as ScreenplayFormatKey | undefined) ?? "us",
    custom_format_id:
      patch.customFormatId === undefined ? (current?.custom_format_id ?? null) : patch.customFormatId,
    visual_overrides: {
      ...(current?.visual_overrides ?? {}),
      ...(patch.visualOverrides ?? {}),
    },
    break_policy_overrides: {
      ...(current?.break_policy_overrides ?? {}),
      ...(patch.breakPolicyOverrides ?? {}),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("document_screenplay_render_settings")
    .upsert(nextRow, { onConflict: "document_id" })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data as Row };
}
