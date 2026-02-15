/**
 * 프로젝트 에디터 페이지 (/project/[id])
 *
 * URL의 [id] 부분이 프로젝트 ID가 됩니다.
 * 예: /project/abc-123 → id = "abc-123"
 *
 * 이 페이지는 Server Component로,
 * 서버에서 프로젝트와 문서 데이터를 가져온 뒤
 * 클라이언트 에디터 컴포넌트에 전달합니다.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditorPage from "./EditorPage";

export default async function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  // 프로젝트 정보 가져오기
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  // 프로젝트가 없거나 접근 권한이 없으면 메인으로 이동
  if (projectError || !project) {
    redirect("/");
  }

  // 프로젝트의 첫 번째 문서 가져오기
  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  return (
    <EditorPage
      project={project}
      document={document}
    />
  );
}
