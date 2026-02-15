/**
 * 프로젝트 관련 서버 액션 (Server Actions)
 *
 * "use server" = 이 파일의 함수들은 서버에서만 실행됩니다.
 *
 * 프로젝트를 만들고, 목록을 가져오고, 삭제하는 함수들입니다.
 * 모든 함수는 Supabase 서버 클라이언트를 사용하여
 * RLS(Row Level Security)를 통해 본인의 데이터만 접근합니다.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 새 프로젝트를 생성합니다.
 *
 * 프로젝트 생성 시, 기본 문서 1개도 함께 만듭니다.
 * (빈 프로젝트에 바로 글쓰기를 시작할 수 있도록)
 */
export async function createProject(formData: FormData) {
  const supabase = await createClient();

  // 현재 로그인된 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;

  if (!title || title.trim() === "") {
    return { error: "프로젝트 제목을 입력해주세요." };
  }

  // 1. 프로젝트 생성
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: title.trim(),
    })
    .select()
    .single();

  if (projectError) {
    return { error: `프로젝트 생성 실패: ${projectError.message}` };
  }

  // 2. 기본 문서 1개 생성 (빈 시나리오)
  await supabase.from("documents").insert({
    project_id: project.id,
    title: "시나리오",
  });

  // 메인 페이지의 프로젝트 목록을 갱신합니다.
  revalidatePath("/");

  return { success: true, projectId: project.id };
}

/**
 * 내 프로젝트 목록을 가져옵니다.
 * 최신순으로 정렬됩니다.
 */
export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data ?? [], error: null };
}

/**
 * 프로젝트를 삭제합니다.
 * RLS 정책에 의해 본인의 프로젝트만 삭제됩니다.
 * 프로젝트 삭제 시 관련 문서도 cascade로 함께 삭제됩니다.
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    return { error: `삭제 실패: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}
