"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "document-assets";

// Supported image formats for markdown documents
const SUPPORTED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type DocumentOwnership = {
  documentId: string;
  projectId: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function assertDocumentOwnership(
  documentId: string
): Promise<{ ok: true; value: DocumentOwnership } | { ok: false; error: string }> {
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

/**
 * Generate presigned upload URL for markdown image
 * @param documentId - The document ID
 * @param filename - Original filename
 * @param mimeType - MIME type of the image
 * @returns Presigned URL and upload metadata
 */
export async function createMarkdownImageUploadUrl(
  documentId: string,
  filename: string,
  mimeType: string
) {
  // Validate image format
  if (!SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
    return {
      success: false,
      error: `지원하지 않는 이미지 형식입니다. 지원 형식: JPEG, PNG, GIF, WebP, SVG`,
    };
  }

  const owner = await assertDocumentOwnership(documentId);
  if (!owner.ok) return { success: false, error: owner.error };

  const safeName = sanitizeFileName(filename || "image");
  const uuid = randomUUID();
  // Storage path: document_assets/{projectId}/{documentId}/{uuid}-{filename}
  const path = `${owner.value.projectId}/${owner.value.documentId}/${uuid}-${safeName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "업로드 URL 생성 실패",
    };
  }

  return {
    success: true,
    url: data.signedUrl,
    path: data.path,
    token: data.token,
  };
}

/**
 * Confirm markdown image upload and create asset record
 * @param args - Upload confirmation parameters
 * @returns Asset ID and public URL
 */
export async function confirmMarkdownImageUpload(args: {
  documentId: string;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
}) {
  // Validate file size
  if (args.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `파일 크기가 너무 큽니다. 최대 크기: 10MB`,
    };
  }

  // Validate image format
  if (!SUPPORTED_IMAGE_FORMATS.includes(args.mimeType)) {
    return {
      success: false,
      error: `지원하지 않는 이미지 형식입니다. 지원 형식: JPEG, PNG, GIF, WebP, SVG`,
    };
  }

  const owner = await assertDocumentOwnership(args.documentId);
  if (!owner.ok) return { success: false, error: owner.error };

  // Verify path belongs to this document
  if (
    !args.path.startsWith(
      `${owner.value.projectId}/${owner.value.documentId}/`
    )
  ) {
    return { success: false, error: "잘못된 업로드 경로입니다." };
  }

  const supabase = await createClient();
  const { data: publicData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(args.path);
  const publicUrl = publicData.publicUrl;

  const { data, error } = await supabase
    .from("document_assets")
    .insert({
      document_id: owner.value.documentId,
      project_id: owner.value.projectId,
      path: args.path,
      url: publicUrl,
      mime_type: args.mimeType,
      size_bytes: args.size,
    })
    .select("id, url, path")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "에셋 메타 저장 실패",
    };
  }

  return {
    success: true,
    assetId: data.id,
    publicUrl: data.url,
  };
}

/**
 * Delete markdown image asset
 * @param assetId - The asset ID to delete
 * @returns Success status
 */
export async function deleteMarkdownImage(assetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // Get asset details
  const { data: asset, error: fetchError } = await supabase
    .from("document_assets")
    .select("id, path, project_id")
    .eq("id", assetId)
    .single();

  if (fetchError || !asset) {
    return { success: false, error: "에셋을 찾을 수 없습니다." };
  }

  // Verify ownership through project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", asset.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return { success: false, error: "삭제 권한이 없습니다." };
  }

  // Remove from storage
  const { error: removeStorageError } = await supabase.storage
    .from(BUCKET)
    .remove([asset.path]);

  if (removeStorageError) {
    return { success: false, error: removeStorageError.message };
  }

  // Delete database record
  const { error: deleteError } = await supabase
    .from("document_assets")
    .delete()
    .eq("id", assetId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  return { success: true };
}
