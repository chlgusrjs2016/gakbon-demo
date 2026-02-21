"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "document-assets";

type DocumentOwnership = {
  documentId: string;
  projectId: string;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function assertDocumentOwnership(documentId: string): Promise<{ ok: true; value: DocumentOwnership } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, project_id, projects!inner(user_id)")
    .eq("id", documentId)
    .single();

  if (error || !doc) {
    return { ok: false, error: "문서를 찾을 수 없습니다." };
  }

  const projectUserId = Array.isArray(doc.projects)
    ? doc.projects[0]?.user_id
    : (doc.projects as { user_id?: string } | null)?.user_id;

  if (!projectUserId || projectUserId !== user.id) {
    return { ok: false, error: "문서 접근 권한이 없습니다." };
  }

  return {
    ok: true,
    value: {
      documentId: doc.id,
      projectId: doc.project_id,
    },
  };
}

export async function createImageUploadUrl(documentId: string, filename: string, mimeType: string) {
  const owner = await assertDocumentOwnership(documentId);
  if (!owner.ok) return { success: false, error: owner.error };

  const safeName = sanitizeFileName(filename || "image");
  const path = `${owner.value.projectId}/${owner.value.documentId}/${Date.now()}-${randomUUID()}-${safeName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { success: false, error: error?.message ?? "업로드 URL 생성 실패" };
  }

  return {
    success: true,
    data: {
      bucket: BUCKET,
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      mimeType,
      projectId: owner.value.projectId,
    },
  };
}

export async function confirmImageUpload(args: {
  documentId: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const owner = await assertDocumentOwnership(args.documentId);
  if (!owner.ok) return { success: false, error: owner.error };

  if (!args.path.startsWith(`${owner.value.projectId}/${owner.value.documentId}/`)) {
    return { success: false, error: "잘못된 업로드 경로입니다." };
  }

  const supabase = await createClient();
  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(args.path);
  const publicUrl = publicData.publicUrl;

  const { data, error } = await supabase
    .from("document_assets")
    .insert({
      document_id: owner.value.documentId,
      project_id: owner.value.projectId,
      path: args.path,
      url: publicUrl,
      mime_type: args.mimeType,
      size_bytes: args.sizeBytes,
    })
    .select("id, url, path")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "에셋 메타 저장 실패" };
  }

  return {
    success: true,
    data: {
      assetId: data.id,
      url: data.url,
      path: data.path,
    },
  };
}

export async function deleteDocumentAsset(assetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { data, error } = await supabase
    .from("document_assets")
    .select("id, path, project_id")
    .eq("id", assetId)
    .single();

  if (error || !data) return { success: false, error: "에셋을 찾을 수 없습니다." };

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", data.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) return { success: false, error: "삭제 권한이 없습니다." };

  const { error: removeStorageError } = await supabase.storage.from(BUCKET).remove([data.path]);
  if (removeStorageError) {
    return { success: false, error: removeStorageError.message };
  }

  const { error: deleteError } = await supabase.from("document_assets").delete().eq("id", assetId);
  if (deleteError) return { success: false, error: deleteError.message };

  return { success: true, error: null };
}
