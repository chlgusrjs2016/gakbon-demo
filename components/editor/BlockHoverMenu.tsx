"use client";

import { Editor } from "@tiptap/react";
import { Trash2, Copy, GripVertical, MoveUp, MoveDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

type BlockHoverMenuProps = {
  editor: Editor | null;
  show: boolean;
  position: { x: number; y: number };
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export default function BlockHoverMenu({
  editor,
  show,
  position,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: BlockHoverMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  if (!editor || !isVisible) {
    return null;
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      // Default delete behavior
      const { from, to } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      const nodeStart = $from.before($from.depth);
      const nodeEnd = $from.after($from.depth);
      
      editor.chain().focus().deleteRange({ from: nodeStart, to: nodeEnd }).run();
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate();
    } else {
      // Default duplicate behavior
      const { from } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      const node = $from.node($from.depth);
      const nodeStart = $from.before($from.depth);
      const nodeEnd = $from.after($from.depth);
      
      if (node) {
        const content = editor.state.doc.slice(nodeStart, nodeEnd).content;
        editor.chain().focus().insertContentAt(nodeEnd, content.toJSON()).run();
      }
    }
  };

  const handleMoveUp = () => {
    if (onMoveUp) {
      onMoveUp();
    } else {
      // Default move up behavior
      const { from } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      
      if ($from.depth > 0) {
        const nodeStart = $from.before($from.depth);
        const nodeEnd = $from.after($from.depth);
        const node = $from.node($from.depth);
        
        // Find previous sibling position
        const prevPos = nodeStart - 1;
        if (prevPos > 0) {
          const $prev = editor.state.doc.resolve(prevPos);
          const prevNodeStart = $prev.before($prev.depth);
          
          // Get the content to move
          const content = editor.state.doc.slice(nodeStart, nodeEnd).content;
          
          // Delete current node and insert before previous
          editor
            .chain()
            .focus()
            .deleteRange({ from: nodeStart, to: nodeEnd })
            .insertContentAt(prevNodeStart, content.toJSON())
            .run();
        }
      }
    }
  };

  const handleMoveDown = () => {
    if (onMoveDown) {
      onMoveDown();
    } else {
      // Default move down behavior
      const { from } = editor.state.selection;
      const $from = editor.state.doc.resolve(from);
      
      if ($from.depth > 0) {
        const nodeStart = $from.before($from.depth);
        const nodeEnd = $from.after($from.depth);
        const node = $from.node($from.depth);
        
        // Find next sibling position
        const nextPos = nodeEnd + 1;
        if (nextPos < editor.state.doc.content.size) {
          const $next = editor.state.doc.resolve(nextPos);
          const nextNodeEnd = $next.after($next.depth);
          
          // Get the content to move
          const content = editor.state.doc.slice(nodeStart, nodeEnd).content;
          
          // Delete current node and insert after next
          editor
            .chain()
            .focus()
            .deleteRange({ from: nodeStart, to: nodeEnd })
            .insertContentAt(nextNodeEnd - (nodeEnd - nodeStart), content.toJSON())
            .run();
        }
      }
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <button
        type="button"
        className="drag-handle flex h-7 w-7 cursor-grab items-center justify-center rounded hover:bg-zinc-100 active:cursor-grabbing dark:hover:bg-zinc-700"
        title="드래그하여 이동"
        aria-label="드래그하여 블록 이동"
      >
        <GripVertical className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>
      
      <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
      
      <button
        type="button"
        onClick={handleMoveUp}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
        title="위로 이동"
        aria-label="블록을 위로 이동"
      >
        <MoveUp className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
      </button>
      
      <button
        type="button"
        onClick={handleMoveDown}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
        title="아래로 이동"
        aria-label="블록을 아래로 이동"
      >
        <MoveDown className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
      </button>
      
      <button
        type="button"
        onClick={handleDuplicate}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
        title="복제"
        aria-label="블록 복제"
      >
        <Copy className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
      </button>
      
      <button
        type="button"
        onClick={handleDelete}
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20"
        title="삭제"
        aria-label="블록 삭제"
      >
        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
      </button>
    </div>
  );
}
