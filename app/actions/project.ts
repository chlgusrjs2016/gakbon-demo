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
    .is("deleted_at", null)
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
  return moveProjectToTrash(projectId);
}

export async function renameProject(projectId: string, title: string) {
  const supabase = await createClient();
  const nextTitle = title.trim();
  if (!nextTitle) return { success: false, error: "프로젝트 이름을 입력해주세요." };

  const { error } = await supabase
    .from("projects")
    .update({ title: nextTitle })
    .eq("id", projectId)
    .is("deleted_at", null);

  if (error) return { success: false, error: `이름 변경 실패: ${error.message}` };
  revalidatePath("/");
  return { success: true, error: null };
}

export async function moveProjectToTrash(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId)
    .is("deleted_at", null);

  if (error) {
    return { error: `삭제 실패: ${error.message}` };
  }

  revalidatePath("/");
  return { success: true };
}

export async function duplicateProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sourceProject, error: sourceProjectError } = await supabase
    .from("projects")
    .select("id,user_id,title,description")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();
  if (sourceProjectError || !sourceProject) {
    return { success: false, error: sourceProjectError?.message ?? "원본 프로젝트를 찾지 못했습니다." };
  }

  const { data: newProject, error: newProjectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: `${sourceProject.title} (복제)`,
      description: sourceProject.description ?? "",
    })
    .select("id")
    .single();
  if (newProjectError || !newProject) {
    return { success: false, error: newProjectError?.message ?? "프로젝트 복제 생성에 실패했습니다." };
  }

  const [{ data: sourceFolders }, { data: sourceDocs }] = await Promise.all([
    supabase
      .from("document_folders")
      .select("id,name,sort_order")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("documents")
      .select("id,title,content,sort_order,folder_id,document_type")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const folderIdMap = new Map<string, string>();
  for (const folder of sourceFolders ?? []) {
    const { data: insertedFolder, error: folderError } = await supabase
      .from("document_folders")
      .insert({
        project_id: newProject.id,
        name: folder.name,
        sort_order: folder.sort_order,
      })
      .select("id")
      .single();
    if (folderError || !insertedFolder) {
      return { success: false, error: folderError?.message ?? "폴더 복제에 실패했습니다." };
    }
    folderIdMap.set(folder.id, insertedFolder.id);
  }

  for (const doc of sourceDocs ?? []) {
    const mappedFolderId = doc.folder_id ? folderIdMap.get(doc.folder_id) ?? null : null;
    const { error: docError } = await supabase.from("documents").insert({
      project_id: newProject.id,
      title: doc.title,
      content: doc.content,
      sort_order: doc.sort_order,
      folder_id: mappedFolderId,
      document_type: doc.document_type,
    });
    if (docError) {
      return { success: false, error: docError.message };
    }
  }

  revalidatePath("/");
  return { success: true, projectId: newProject.id };
}
