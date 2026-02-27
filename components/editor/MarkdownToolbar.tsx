"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Link2,
  ImagePlus,
  Table2,
  Code,
  Quote,
  Minus,
  Keyboard,
  FileDown,
} from "lucide-react";

type MarkdownToolbarProps = {
  editor: Editor | null;
  documentId?: string;
  onImageUpload?: () => void;
  onExportPdf?: () => void;
};

const baseButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/60 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100";

const activeButtonClass = "bg-white/70 text-zinc-800 dark:bg-white/[0.12] dark:text-zinc-100";

function MarkdownToolbarImpl({ editor, onImageUpload, onExportPdf }: MarkdownToolbarProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((v) => v + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const actions = useMemo(
    () => [
      { key: "undo", icon: Undo2, label: "Undo", run: () => editor?.chain().focus().undo().run(), active: false },
      { key: "redo", icon: Redo2, label: "Redo", run: () => editor?.chain().focus().redo().run(), active: false },
      { key: "bold", icon: Bold, label: "Bold", run: () => editor?.chain().focus().toggleBold().run(), active: !!editor?.isActive("bold") },
      {
        key: "italic",
        icon: Italic,
        label: "Italic",
        run: () => editor?.chain().focus().toggleItalic().run(),
        active: !!editor?.isActive("italic"),
      },
      {
        key: "underline",
        icon: Underline,
        label: "Underline",
        run: () => editor?.chain().focus().toggleUnderline().run(),
        active: !!editor?.isActive("underline"),
      },
      {
        key: "strike",
        icon: Strikethrough,
        label: "Strikethrough",
        run: () => editor?.chain().focus().toggleStrike().run(),
        active: !!editor?.isActive("strike"),
      },
      {
        key: "h1",
        icon: Heading1,
        label: "Heading 1",
        run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
        active: !!editor?.isActive("heading", { level: 1 }),
      },
      {
        key: "h2",
        icon: Heading2,
        label: "Heading 2",
        run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
        active: !!editor?.isActive("heading", { level: 2 }),
      },
      {
        key: "h3",
        icon: Heading3,
        label: "Heading 3",
        run: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
        active: !!editor?.isActive("heading", { level: 3 }),
      },
      {
        key: "bulletList",
        icon: List,
        label: "Bullet List",
        run: () => editor?.chain().focus().toggleBulletList().run(),
        active: !!editor?.isActive("bulletList"),
      },
      {
        key: "orderedList",
        icon: ListOrdered,
        label: "Numbered List",
        run: () => editor?.chain().focus().toggleOrderedList().run(),
        active: !!editor?.isActive("orderedList"),
      },
      {
        key: "taskList",
        icon: ListTodo,
        label: "Task List",
        run: () => editor?.chain().focus().toggleTaskList().run(),
        active: !!editor?.isActive("taskList"),
      },
      {
        key: "blockquote",
        icon: Quote,
        label: "Blockquote",
        run: () => editor?.chain().focus().toggleBlockquote().run(),
        active: !!editor?.isActive("blockquote"),
      },
      {
        key: "codeBlock",
        icon: Code,
        label: "Code Block",
        run: () => editor?.chain().focus().toggleCodeBlock().run(),
        active: !!editor?.isActive("codeBlock"),
      },
    ],
    [editor]
  );

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
    <div className="sticky top-0 z-30 shrink-0 px-8 pt-3">
      <div
        className={[
          "mx-auto flex w-full max-w-[980px] items-center gap-1 rounded-xl px-3 py-2",
          "bg-white/35 dark:bg-white/[0.04]",
          "backdrop-blur-2xl",
          "border border-white/60 dark:border-white/[0.1]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
        ].join(" ")}
        role="toolbar"
        aria-label="Markdown formatting toolbar"
      >
        {actions.slice(0, 2).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              className={baseButtonClass}
              aria-label={action.label}
              title={action.label}
              onClick={action.run}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        {actions.slice(2).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              className={`${baseButtonClass} ${action.active ? activeButtonClass : ""}`}
              aria-label={action.label}
              title={action.label}
              onClick={action.run}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        <button
          type="button"
          className={`${baseButtonClass} ${editor?.isActive("link") ? activeButtonClass : ""}`}
          aria-label="Link"
          title="Link"
          onClick={setLink}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={baseButtonClass}
          aria-label="Image"
          title="Image"
          onClick={onImageUpload}
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={baseButtonClass}
          aria-label="Insert table"
          title="Insert table"
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={baseButtonClass}
          aria-label="Horizontal rule"
          title="Horizontal rule"
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        <button
          type="button"
          className={baseButtonClass}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
          onClick={() => setShowShortcuts((v) => !v)}
        >
          <Keyboard className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={baseButtonClass}
          aria-label="Export PDF"
          title="Export PDF"
          onClick={onExportPdf}
        >
          <FileDown className="h-4 w-4" />
        </button>
      </div>

      {showShortcuts && (
        <div className="mx-auto mt-2 w-full max-w-[980px] rounded-lg border border-zinc-200/70 bg-white/90 px-3 py-2 text-xs text-zinc-700 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/90 dark:text-zinc-200">
          <p className="font-semibold">Keyboard Shortcuts</p>
          <p className="mt-1">Ctrl/Cmd+B Bold, Ctrl/Cmd+I Italic, Ctrl/Cmd+U Underline, Ctrl/Cmd+K Link</p>
          <p>Ctrl/Cmd+Shift+C Code Block, Ctrl/Cmd+Z Undo, Ctrl/Cmd+Y Redo</p>
        </div>
      )}
    </div>
  );
}

export default memo(MarkdownToolbarImpl);
export type { MarkdownToolbarProps };
