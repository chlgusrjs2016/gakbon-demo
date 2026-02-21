"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImagePlus,
  Table2,
  Link2,
  Link2Off,
  Rows2,
  Columns2,
  MinusSquare,
  PlusSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { confirmImageUpload, createImageUploadUrl } from "@/app/actions/documentAsset";

type DocumentToolbarProps = {
  editor: Editor | null;
  documentId?: string | null;
  onImageUploadReady?: (fn: () => void) => void;
};

const FONT_OPTIONS = [
  { label: "Pretendard", value: "Pretendard, sans-serif" },
  { label: "Noto Sans KR", value: "var(--font-noto-sans-kr), sans-serif" },
  { label: "IBM Plex Sans KR", value: "var(--font-ibm-plex-sans-kr), sans-serif" },
  { label: "Nanum Myeongjo", value: "var(--font-nanum-myeongjo), serif" },
];

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32];

export default function DocumentToolbar({
  editor,
  documentId,
  onImageUploadReady,
}: DocumentToolbarProps) {
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(16);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const syncToolbarState = useMemo(
    () => () => {
      if (!editor) return;
      const attrs = editor.getAttributes("textStyle") as { fontFamily?: string; fontSize?: string };
      const nextFamily = attrs.fontFamily || FONT_OPTIONS[0].value;
      const sizeFromMark = attrs.fontSize ? Number(attrs.fontSize.replace("px", "")) : null;
      setFontFamily(nextFamily);
      if (sizeFromMark && Number.isFinite(sizeFromMark)) {
        setFontSize(sizeFromMark);
      }
    },
    [editor]
  );

  useEffect(() => {
    if (!editor) return;
    const rafId = requestAnimationFrame(() => {
      syncToolbarState();
    });
    editor.on("selectionUpdate", syncToolbarState);
    editor.on("transaction", syncToolbarState);
    return () => {
      cancelAnimationFrame(rafId);
      editor.off("selectionUpdate", syncToolbarState);
      editor.off("transaction", syncToolbarState);
    };
  }, [editor, syncToolbarState]);

  const triggerImageUpload = useCallback(() => {
    if (!documentId || isUploading) return;
    fileInputRef.current?.click();
  }, [documentId, isUploading]);

  useEffect(() => {
    onImageUploadReady?.(triggerImageUpload);
  }, [onImageUploadReady, triggerImageUpload]);

  const onPickImage = async (file: File | null) => {
    if (!file || !editor || !documentId) return;
    setIsUploading(true);

    const uploadMeta = await createImageUploadUrl(documentId, file.name, file.type);
    if (!uploadMeta.success || !uploadMeta.data) {
      setIsUploading(false);
      window.alert(uploadMeta.error ?? "이미지 업로드 준비에 실패했습니다.");
      return;
    }

    const supabase = createClient();
    const upload = await supabase.storage
      .from(uploadMeta.data.bucket)
      .uploadToSignedUrl(uploadMeta.data.path, uploadMeta.data.token, file);

    if (upload.error) {
      setIsUploading(false);
      window.alert(upload.error.message);
      return;
    }

    const confirmed = await confirmImageUpload({
      documentId,
      path: uploadMeta.data.path,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    });

    setIsUploading(false);
    if (!confirmed.success || !confirmed.data) {
      window.alert(confirmed.error ?? "이미지 메타데이터 저장에 실패했습니다.");
      return;
    }

    editor.chain().focus().setImage({ src: confirmed.data.url, alt: file.name }).run();
  };

  const iconBtnClass = [
    "inline-flex h-8 w-8 items-center justify-center rounded-md",
    "text-zinc-500 transition-colors",
    "hover:bg-white/60 hover:text-zinc-800",
    "dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100",
  ].join(" ");

  const iconBtnActiveClass = "bg-white/70 text-zinc-800 dark:bg-white/[0.12] dark:text-zinc-100";

  const setLink = () => {
    if (!editor) return;
    const previousUrl = (editor.getAttributes("link")?.href as string | undefined) ?? "";
    const url = window.prompt("링크 URL을 입력하세요", previousUrl);
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="shrink-0 px-8 pt-3">
      <div
        className={[
          "mx-auto flex w-full max-w-[980px] items-center gap-1 rounded-xl px-3 py-2",
          "bg-white/35 dark:bg-white/[0.04]",
          "backdrop-blur-2xl",
          "border border-white/60 dark:border-white/[0.1]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
        ].join(" ")}
      >
        <button
          type="button"
          className={iconBtnClass}
          title="뒤로가기"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          title="앞으로가기"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        <select
          value={fontFamily}
          onChange={(e) => {
            const next = e.target.value;
            setFontFamily(next);
            editor?.chain().focus().setFontFamily(next).run();
          }}
          className="h-8 rounded-md bg-transparent px-2 text-sm text-zinc-700 outline-none dark:text-zinc-200"
          title="폰트"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <select
          value={fontSize}
          onChange={(e) => {
            const next = Number(e.target.value);
            setFontSize(next);
            editor?.chain().focus().setFontSize(`${next}px`).run();
          }}
          className="h-8 w-16 rounded-md bg-transparent px-2 text-sm text-zinc-700 outline-none dark:text-zinc-200"
          title="폰트 크기"
        >
          {FONT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive("bold") ? iconBtnActiveClass : ""}`}
          title="볼드"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive("italic") ? iconBtnActiveClass : ""}`}
          title="이탤릭"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive("underline") ? iconBtnActiveClass : ""}`}
          title="언더라인"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive("strike") ? iconBtnActiveClass : ""}`}
          title="취소선"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive("highlight") ? iconBtnActiveClass : ""}`}
          title="하이라이트"
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive({ textAlign: "left" }) ? iconBtnActiveClass : ""}`}
          title="왼쪽 정렬"
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive({ textAlign: "center" }) ? iconBtnActiveClass : ""}`}
          title="가운데 정렬"
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive({ textAlign: "right" }) ? iconBtnActiveClass : ""}`}
          title="오른쪽 정렬"
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive({ textAlign: "justify" }) ? iconBtnActiveClass : ""}`}
          title="양쪽 정렬"
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        <button
          type="button"
          className={`${iconBtnClass} ${editor?.isActive("link") ? iconBtnActiveClass : ""}`}
          title="링크 삽입"
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          title="링크 제거"
          onClick={() => editor?.chain().focus().unsetLink().run()}
        >
          <Link2Off className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        <button
          type="button"
          className={iconBtnClass}
          title="이미지 삽입"
          onClick={triggerImageUpload}
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            void onPickImage(file);
            e.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          className={iconBtnClass}
          title="표 삽입"
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          title="행 추가"
          onClick={() => editor?.chain().focus().addRowAfter().run()}
        >
          <Rows2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          title="열 추가"
          onClick={() => editor?.chain().focus().addColumnAfter().run()}
        >
          <Columns2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          title="행 삭제"
          onClick={() => editor?.chain().focus().deleteRow().run()}
        >
          <MinusSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconBtnClass}
          title="열 삭제"
          onClick={() => editor?.chain().focus().deleteColumn().run()}
        >
          <PlusSquare className="h-4 w-4 rotate-45" />
        </button>
        {isUploading && (
          <span className="ml-2 text-[11px] text-zinc-500 dark:text-zinc-300">이미지 업로드 중...</span>
        )}
      </div>
    </div>
  );
}
