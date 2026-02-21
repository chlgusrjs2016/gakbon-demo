"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { JSONContent, Editor } from "@tiptap/react";
import { DocUnderline } from "@/lib/editor/extensions/DocUnderline";
import { DocHighlight } from "@/lib/editor/extensions/DocHighlight";
import { DocTextStyle } from "@/lib/editor/extensions/DocTextStyle";
import { DocTextAlign } from "@/lib/editor/extensions/DocTextAlign";
import { DocImage } from "@/lib/editor/extensions/DocImage";
import { DocTable, DocTableCell, DocTableHeader, DocTableRow } from "@/lib/editor/extensions/DocTable";

type DocumentEditorProps = {
  content: JSONContent | null;
  onUpdate?: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
  onRequestImageUpload?: () => void;
};

const EMPTY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function getInitialContent(content: JSONContent | null): JSONContent {
  if (content && typeof content === "object" && content.type === "doc") {
    return content;
  }
  return EMPTY_DOCUMENT;
}

type SlashCommandItem = {
  id: string;
  label: string;
  keywords: string[];
  run: (editor: Editor, onRequestImageUpload?: () => void) => void;
};

export default function DocumentEditor({
  content,
  onUpdate,
  onEditorReady,
  onRequestImageUpload,
}: DocumentEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashPos, setSlashPos] = useState({ x: 0, y: 0 });
  const [keepSlashOnBlur, setKeepSlashOnBlur] = useState(false);
  const slashOpenRef = useRef(false);
  const slashIndexRef = useRef(0);
  const filteredCommandsRef = useRef<SlashCommandItem[]>([]);

  const slashCommands = useMemo<SlashCommandItem[]>(
    () => [
      {
        id: "h1",
        label: "Heading 1",
        keywords: ["heading", "h1", "title", "제목1"],
        run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "h2",
        label: "Heading 2",
        keywords: ["heading", "h2", "subtitle", "제목2"],
        run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "h3",
        label: "Heading 3",
        keywords: ["heading", "h3", "small title", "제목3"],
        run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: "bullet",
        label: "Bulleted List",
        keywords: ["list", "bullet", "ul", "목록"],
        run: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        id: "ordered",
        label: "Numbered List",
        keywords: ["list", "ordered", "ol", "번호"],
        run: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "checklist",
        label: "Checklist",
        keywords: ["task", "checklist", "todo", "체크리스트"],
        run: (editor) => editor.chain().focus().toggleTaskList().run(),
      },
      {
        id: "blockquote",
        label: "Blockquote",
        keywords: ["quote", "blockquote", "인용"],
        run: (editor) => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        id: "divider",
        label: "Divider",
        keywords: ["divider", "hr", "line", "구분선"],
        run: (editor) => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        id: "table",
        label: "Table",
        keywords: ["table", "표"],
        run: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      },
      {
        id: "image",
        label: "Image Upload",
        keywords: ["image", "사진", "이미지"],
        run: (_editor, requestImageUpload) => requestImageUpload?.(),
      },
      {
        id: "code",
        label: "Code Block",
        keywords: ["code", "snippet", "코드"],
        run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
      },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    const q = slashQuery.trim().toLowerCase();
    if (!q) return slashCommands;
    return slashCommands.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      return item.keywords.some((k) => k.toLowerCase().includes(q));
    });
  }, [slashCommands, slashQuery]);

  useEffect(() => {
    filteredCommandsRef.current = filteredCommands;
  }, [filteredCommands]);

  useEffect(() => {
    slashIndexRef.current = slashIndex;
  }, [slashIndex]);

  const openSlashMenu = (editor: Editor) => {
    const coords = editor.view.coordsAtPos(editor.state.selection.from);
    setSlashPos({ x: coords.left, y: coords.bottom + 6 });
    setSlashQuery("");
    setSlashIndex(0);
    setSlashOpen(true);
    slashOpenRef.current = true;
  };

  const closeSlashMenu = () => {
    setSlashOpen(false);
    setSlashQuery("");
    setSlashIndex(0);
    slashOpenRef.current = false;
  };

  const applySlashCommand = (item: SlashCommandItem, editor: Editor) => {
    item.run(editor, onRequestImageUpload);
    closeSlashMenu();
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "문서를 작성하세요. '/' 를 입력해 블록 명령을 열 수 있습니다.",
      }),
      DocTextStyle,
      DocTextAlign,
      DocUnderline,
      DocHighlight,
      DocImage,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      DocTable,
      DocTableRow,
      DocTableHeader,
      DocTableCell,
    ],
    content: getInitialContent(content),
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getJSON());
    },
    autofocus: "end",
    editorProps: {
      attributes: {
        class: "document-editor-content",
      },
      handleKeyDown: (_view, event) => {
        if (!editor) return false;
        if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          openSlashMenu(editor);
          return true;
        }

        if (!slashOpenRef.current) return false;

        if (event.key === "Escape") {
          event.preventDefault();
          closeSlashMenu();
          return true;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          const max = Math.max(0, filteredCommandsRef.current.length - 1);
          setSlashIndex((prev) => Math.min(prev + 1, max));
          return true;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((prev) => Math.max(prev - 1, 0));
          return true;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const list = filteredCommandsRef.current;
          const picked = list[slashIndexRef.current] ?? list[0];
          if (picked) applySlashCommand(picked, editor);
          else closeSlashMenu();
          return true;
        }

        if (event.key === "Backspace") {
          event.preventDefault();
          setSlashQuery((prev) => {
            const next = prev.slice(0, -1);
            if (!next) setSlashIndex(0);
            return next;
          });
          return true;
        }

        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          setSlashQuery((prev) => prev + event.key.toLowerCase());
          setSlashIndex(0);
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <div className="document-editor relative">
      <EditorContent
        editor={editor}
        onBlur={() => {
          if (keepSlashOnBlur) return;
          closeSlashMenu();
        }}
      />
      {slashOpen && (
        <div
          className="fixed z-[120] min-w-[220px] overflow-hidden rounded-xl border border-white/60 bg-white/90 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/[0.1] dark:bg-zinc-900/90"
          style={{ left: slashPos.x, top: slashPos.y }}
          onMouseDown={() => setKeepSlashOnBlur(true)}
          onMouseUp={() => setKeepSlashOnBlur(false)}
        >
          {filteredCommands.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-300">일치하는 명령이 없습니다.</div>
          ) : (
            filteredCommands.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={[
                  "flex w-full items-center px-3 py-2 text-left text-xs transition-colors",
                  idx === slashIndex
                    ? "bg-zinc-100 text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
                ].join(" ")}
                onClick={() => applySlashCommand(item, editor)}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
