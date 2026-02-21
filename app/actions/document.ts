/**
 * 문서 관련 서버 액션 (Server Actions)
 *
 * 시나리오 문서를 불러오고 저장하는 함수들입니다.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import type { JSONContent } from "@tiptap/react";

export type DocumentType = "screenplay" | "document";
export type DocumentFolder = {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  parent_folder_id?: string | null;
  deleted_at?: string | null;
};

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
 * 프로젝트의 문서 목록을 가져옵니다.
 */
export async function getDocuments(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getTrashedDocuments(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getDocumentFolders(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_folders")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

/**
 * 프로젝트에 새 문서를 추가합니다.
 */
export async function createDocument(
  projectId: string,
  title?: string,
  documentType: DocumentType = "screenplay",
  folderId: string | null = null
) {
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("documents")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (latest?.sort_order ?? -1) + 1;
  const safeTitle = (title?.trim() || `문서 ${nextOrder + 1}`).slice(0, 120);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: projectId,
      title: safeTitle,
      document_type: documentType,
      folder_id: folderId,
      sort_order: nextOrder,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createDocumentFolder(projectId: string, name: string) {
  const supabase = await createClient();

  const safeName = (name?.trim() || "새 폴더").slice(0, 80);
  const { data: latest } = await supabase
    .from("document_folders")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (latest?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("document_folders")
    .insert({
      project_id: projectId,
      name: safeName,
      sort_order: nextOrder,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function reorderProjectDocuments(
  projectId: string,
  updates: Array<{ id: string; sort_order: number; folder_id: string | null }>
) {
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return { success: false, error: "프로젝트를 찾을 수 없습니다." };
  }

  const ids = updates.map((u) => u.id);
  if (ids.length === 0) return { success: true, error: null };

  const { data: ownedDocs, error: docsError } = await supabase
    .from("documents")
    .select("id")
    .eq("project_id", projectId)
    .in("id", ids);

  if (docsError) {
    return { success: false, error: docsError.message };
  }

  if ((ownedDocs ?? []).length !== ids.length) {
    return { success: false, error: "일부 문서에 접근 권한이 없습니다." };
  }

  for (const row of updates) {
    const { error } = await supabase
      .from("documents")
      .update({
        sort_order: row.sort_order,
        folder_id: row.folder_id,
      })
      .eq("id", row.id)
      .eq("project_id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }
  }

  return { success: true, error: null };
}

export async function renameDocument(documentId: string, nextTitle: string) {
  const supabase = await createClient();
  const title = (nextTitle?.trim() || "제목 없음").slice(0, 120);

  const { error } = await supabase
    .from("documents")
    .update({ title })
    .eq("id", documentId)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function duplicateDocument(documentId: string) {
  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .is("deleted_at", null)
    .single();

  if (sourceError || !source) {
    return { success: false, error: sourceError?.message ?? "문서를 찾을 수 없습니다.", data: null };
  }

  const { data: latest } = await supabase
    .from("documents")
    .select("sort_order")
    .eq("project_id", source.project_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (latest?.sort_order ?? -1) + 1;
  const copyTitle = `${source.title} (복제)`.slice(0, 120);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      project_id: source.project_id,
      title: copyTitle,
      content: source.content,
      sort_order: nextOrder,
      document_type: source.document_type,
      folder_id: source.folder_id,
    })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message, data: null };
  return { success: true, error: null, data };
}

export async function moveDocumentToTrash(documentId: string) {
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("documents")
    .select("folder_id")
    .eq("id", documentId)
    .is("deleted_at", null)
    .single();

  if (currentError || !current) {
    return { success: false, error: currentError?.message ?? "문서를 찾을 수 없습니다." };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      deleted_at: new Date().toISOString(),
      original_folder_id: current.folder_id,
      folder_id: null,
    })
    .eq("id", documentId)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function renameDocumentFolder(folderId: string, nextName: string) {
  const supabase = await createClient();
  const name = (nextName?.trim() || "새 폴더").slice(0, 80);

  const { error } = await supabase
    .from("document_folders")
    .update({ name })
    .eq("id", folderId)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function duplicateDocumentFolder(folderId: string) {
  const supabase = await createClient();

  const { data: sourceFolder, error: folderError } = await supabase
    .from("document_folders")
    .select("*")
    .eq("id", folderId)
    .is("deleted_at", null)
    .single();

  if (folderError || !sourceFolder) {
    return { success: false, error: folderError?.message ?? "폴더를 찾을 수 없습니다." };
  }

  const { data: latestFolder } = await supabase
    .from("document_folders")
    .select("sort_order")
    .eq("project_id", sourceFolder.project_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newFolderOrder = (latestFolder?.sort_order ?? -1) + 1;
  const { data: newFolder, error: newFolderError } = await supabase
    .from("document_folders")
    .insert({
      project_id: sourceFolder.project_id,
      name: `${sourceFolder.name} (복제)`.slice(0, 80),
      sort_order: newFolderOrder,
    })
    .select("*")
    .single();

  if (newFolderError || !newFolder) {
    return { success: false, error: newFolderError?.message ?? "폴더 복제에 실패했습니다." };
  }

  const { data: sourceDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", sourceFolder.project_id)
    .eq("folder_id", sourceFolder.id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if ((sourceDocs ?? []).length > 0) {
    const { data: latestDoc } = await supabase
      .from("documents")
      .select("sort_order")
      .eq("project_id", sourceFolder.project_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    let cursor = (latestDoc?.sort_order ?? -1) + 1;
    const payload = sourceDocs!.map((doc) => ({
      project_id: doc.project_id,
      title: `${doc.title} (복제)`.slice(0, 120),
      content: doc.content,
      sort_order: cursor++,
      document_type: doc.document_type,
      folder_id: newFolder.id,
    }));
    const { error: docsInsertError } = await supabase.from("documents").insert(payload);
    if (docsInsertError) {
      return { success: false, error: docsInsertError.message };
    }
  }

  return { success: true, error: null };
}

export async function moveFolderToTrash(folderId: string) {
  const supabase = await createClient();

  const { data: folder, error: folderError } = await supabase
    .from("document_folders")
    .select("id, project_id")
    .eq("id", folderId)
    .is("deleted_at", null)
    .single();

  if (folderError || !folder) {
    return { success: false, error: folderError?.message ?? "폴더를 찾을 수 없습니다." };
  }

  const now = new Date().toISOString();

  const { error: docsError } = await supabase
    .from("documents")
    .update({
      deleted_at: now,
      original_folder_id: folder.id,
      folder_id: null,
    })
    .eq("project_id", folder.project_id)
    .eq("folder_id", folder.id)
    .is("deleted_at", null);

  if (docsError) return { success: false, error: docsError.message };

  const { error: folderUpdateError } = await supabase
    .from("document_folders")
    .update({ deleted_at: now })
    .eq("id", folder.id)
    .is("deleted_at", null);

  if (folderUpdateError) return { success: false, error: folderUpdateError.message };
  return { success: true, error: null };
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
