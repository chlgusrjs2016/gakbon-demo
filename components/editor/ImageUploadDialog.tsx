"use client";

import { useCallback, useRef, useState } from "react";
import { X, Upload, AlertCircle, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { createClient } from "@/lib/supabase/client";
import {
  createMarkdownImageUploadUrl,
  confirmMarkdownImageUpload,
} from "@/app/actions/markdownImage";

type ImageUploadDialogProps = {
  editor: Editor | null;
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
};

type UploadState = "idle" | "uploading" | "success" | "error";

export default function ImageUploadDialog({
  editor,
  documentId,
  isOpen,
  onClose,
}: ImageUploadDialogProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const resetState = useCallback(() => {
    setUploadState("idle");
    setErrorMessage("");
    setUploadProgress(0);
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor || !documentId) return;

      setUploadState("uploading");
      setUploadProgress(0);
      setErrorMessage("");

      try {
        // Step 1: Get presigned upload URL
        const uploadMeta = await createMarkdownImageUploadUrl(
          documentId,
          file.name,
          file.type
        );

        if (!uploadMeta.success || !uploadMeta.url) {
          throw new Error(uploadMeta.error ?? "업로드 URL 생성 실패");
        }

        setUploadProgress(25);

        // Step 2: Upload to storage
        const supabase = createClient();
        const upload = await supabase.storage
          .from("document-assets")
          .uploadToSignedUrl(uploadMeta.path!, uploadMeta.token!, file);

        if (upload.error) {
          throw new Error(upload.error.message);
        }

        setUploadProgress(75);

        // Step 3: Confirm upload and create asset record
        const confirmed = await confirmMarkdownImageUpload({
          documentId,
          path: uploadMeta.path!,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });

        if (!confirmed.success || !confirmed.publicUrl) {
          throw new Error(confirmed.error ?? "이미지 메타데이터 저장 실패");
        }

        setUploadProgress(100);

        // Step 4: Insert image into editor
        editor
          .chain()
          .focus()
          .setImage({ src: confirmed.publicUrl, alt: file.name })
          .run();

        setUploadState("success");

        // Close dialog after a short delay
        setTimeout(() => {
          handleClose();
        }, 500);
      } catch (error) {
        setUploadState("error");
        setErrorMessage(
          error instanceof Error ? error.message : "이미지 업로드 실패"
        );
      }
    },
    [editor, documentId, handleClose]
  );

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return;
      uploadImage(file);
    },
    [uploadImage]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileSelect(file);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        // Validate that it's an image
        if (file.type.startsWith("image/")) {
          handleFileSelect(file);
        } else {
          setUploadState("error");
          setErrorMessage("이미지 파일만 업로드할 수 있습니다.");
        }
      }
    },
    [handleFileSelect]
  );

  const handleRetry = useCallback(() => {
    resetState();
    fileInputRef.current?.click();
  }, [resetState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          disabled={uploadState === "uploading"}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          이미지 업로드
        </h2>

        {/* Upload area */}
        <div
          className={[
            "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20"
              : "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50",
            uploadState === "uploading" ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploadState === "idle" && (
            <>
              <Upload className="mx-auto mb-4 h-12 w-12 text-zinc-400 dark:text-zinc-500" />
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                이미지를 드래그하거나 클릭하여 선택하세요
              </p>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                JPEG, PNG, GIF, WebP, SVG (최대 10MB)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                파일 선택
              </button>
            </>
          )}

          {uploadState === "uploading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                업로드 중...
              </p>
              <div className="mx-auto mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {uploadProgress}%
              </p>
            </>
          )}

          {uploadState === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                업로드 완료!
              </p>
            </>
          )}

          {uploadState === "error" && (
            <>
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
              <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-400">
                업로드 실패
              </p>
              <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                다시 시도
              </button>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Help text */}
        {uploadState === "idle" && (
          <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Ctrl+V를 눌러 클립보드에서 이미지를 붙여넣을 수도 있습니다
          </p>
        )}
      </div>
    </div>
  );
}
