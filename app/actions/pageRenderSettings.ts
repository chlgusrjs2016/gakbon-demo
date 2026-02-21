"use server";

import { createClient } from "@/lib/supabase/server";
import type { NodeBreakPolicyMap, PageMargins, PageSizeKey } from "@/lib/editor/pageEngine/types";

type PageRenderSettingsRow = {
  project_id: string;
  screenplay_page_size: PageSizeKey;
  screenplay_margins: PageMargins;
  node_break_policies: NodeBreakPolicyMap;
  updated_at: string;
};

type PageRenderSettingsPatch = {
  screenplayPageSize?: PageSizeKey;
  screenplayMargins?: Partial<PageMargins>;
  nodeBreakPolicies?: Partial<NodeBreakPolicyMap>;
};

export async function getProjectPageRenderSettings(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_page_render_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as PageRenderSettingsRow | null) ?? null, error: null };
}

export async function upsertProjectPageRenderSettings(
  projectId: string,
  patch: PageRenderSettingsPatch
) {
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("project_page_render_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (currentError) {
    return { success: false, error: currentError.message, data: null };
  }

  const nextRow = {
    project_id: projectId,
    screenplay_page_size: patch.screenplayPageSize ?? current?.screenplay_page_size ?? "a4",
    screenplay_margins: {
      ...(current?.screenplay_margins ?? {}),
      ...(patch.screenplayMargins ?? {}),
    },
    node_break_policies: {
      ...(current?.node_break_policies ?? {}),
      ...(patch.nodeBreakPolicies ?? {}),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("project_page_render_settings")
    .upsert(nextRow, { onConflict: "project_id" })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message, data: null };
  }

  return { success: true, error: null, data: data as PageRenderSettingsRow };
}
