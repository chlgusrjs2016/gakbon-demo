"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
} from "lucide-react";

type TableMenuProps = {
  editor: Editor | null;
};

export default function TableMenu({ editor }: TableMenuProps) {
  const [isInTable, setIsInTable] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const { selection } = editor.state;
      const { $from } = selection;

      // Check if we're in a table
      let inTable = false;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === "table") {
          inTable = true;
          break;
        }
      }

      setIsInTable(inTable);

      if (inTable) {
        // Position the menu near the table
        const coords = editor.view.coordsAtPos(selection.from);
        setMenuPosition({
          x: coords.left,
          y: coords.top - 50, // Position above the cell
        });
      }
    };

    editor.on("selectionUpdate", updateMenu);
    editor.on("transaction", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
      editor.off("transaction", updateMenu);
    };
  }, [editor]);

  if (!isInTable || !editor) return null;

  const buttonClass = [
    "inline-flex h-8 w-8 items-center justify-center rounded-md",
    "text-zinc-600 transition-colors",
    "hover:bg-white/80 hover:text-zinc-900",
    "dark:text-zinc-300 dark:hover:bg-white/[0.12] dark:hover:text-zinc-100",
  ].join(" ");

  return (
    <div
      className="fixed z-[100] flex items-center gap-1 rounded-lg border border-white/60 bg-white/90 p-1.5 shadow-lg backdrop-blur-xl dark:border-white/[0.1] dark:bg-zinc-900/90"
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
      }}
    >
      {/* Add row above */}
      <button
        type="button"
        className={buttonClass}
        title="위에 행 추가"
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      {/* Add row below */}
      <button
        type="button"
        className={buttonClass}
        title="아래에 행 추가"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <ArrowDown className="h-4 w-4" />
      </button>

      {/* Delete row */}
      <button
        type="button"
        className={buttonClass}
        title="행 삭제"
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

      {/* Add column before */}
      <button
        type="button"
        className={buttonClass}
        title="왼쪽에 열 추가"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      {/* Add column after */}
      <button
        type="button"
        className={buttonClass}
        title="오른쪽에 열 추가"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* Delete column */}
      <button
        type="button"
        className={buttonClass}
        title="열 삭제"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <Plus className="h-4 w-4 rotate-45" />
      </button>

      <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

      {/* Merge cells */}
      <button
        type="button"
        className={buttonClass}
        title="셀 병합"
        onClick={() => editor.chain().focus().mergeCells().run()}
      >
        <Merge className="h-4 w-4" />
      </button>
    </div>
  );
}
