/**
 * 문서 관련 서버 액션 (Server Actions)
 *
 * 시나리오 문서를 불러오고 저장하는 함수들입니다.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import type { JSONContent } from "@tiptap/react";

/**
 * 프로젝트의 첫 번째 문서를 가져옵니다.
 * (MVP에서는 프로젝트당 문서 1개를 기본으로 합니다.)
 */
export async function getDocument(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * 문서 내용을 저장합니다.
 * 에디터에서 자동 저장 시 호출됩니다.
 */
export async function saveDocument(
  documentId: string,
  content: JSONContent
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("documents")
    .update({ content })
    .eq("id", documentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * 프로젝트 정보를 가져옵니다 (제목 표시용).
 */
export async function getProject(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
