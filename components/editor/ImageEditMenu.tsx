"use client";

import { useState, useEffect, useRef } from "react";
import { AlignLeft, AlignCenter, AlignRight, Type, X } from "lucide-react";
import type { Editor } from "@tiptap/react";

type ImageEditMenuProps = {
  editor: Editor | null;
  show: boolean;
  position: { x: number; y: number };
  imageNode: any;
  onClose: () => void;
};

export default function ImageEditMenu({
  editor,
  show,
  position,
  imageNode,
  onClose,
}: ImageEditMenuProps) {
  const [altText, setAltText] = useState("");
  const [showAltInput, setShowAltInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageNode) {
      setAltText(imageNode.attrs.alt || "");
    }
  }, [imageNode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  if (!show || !editor || !imageNode) return null;

  const currentAlign = imageNode.attrs.align || "left";

  const handleAlignChange = (align: "left" | "center" | "right") => {
    editor.commands.updateImage({ align });
  };

  const handleAltTextSave = () => {
    editor.commands.updateImage({ alt: altText });
    setShowAltInput(false);
  };

  const handleAltTextCancel = () => {
    setAltText(imageNode.attrs.alt || "");
    setShowAltInput(false);
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[150] rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {!showAltInput ? (
        <div className="flex flex-col gap-1 p-2">
          {/* Alignment buttons */}
          <div className="flex items-center gap-1 border-b border-zinc-200 pb-2 dark:border-zinc-700">
            <span className="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              정렬:
            </span>
            <button
              type="button"
              onClick={() => handleAlignChange("left")}
              className={[
                "rounded p-1.5 transition-colors",
                currentAlign === "left"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
              ].join(" ")}
              title="왼쪽 정렬"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange("center")}
              className={[
                "rounded p-1.5 transition-colors",
                currentAlign === "center"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
              ].join(" ")}
              title="가운데 정렬"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleAlignChange("right")}
              className={[
                "rounded p-1.5 transition-colors",
                currentAlign === "right"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700",
              ].join(" ")}
              title="오른쪽 정렬"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          {/* Alt text button */}
          <button
            type="button"
            onClick={() => setShowAltInput(true)}
            className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <Type className="h-4 w-4" />
            <span>대체 텍스트 편집</span>
          </button>

          {/* Current alt text preview */}
          {imageNode.attrs.alt && (
            <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                현재: {imageNode.attrs.alt}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3" style={{ minWidth: "300px" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              대체 텍스트
            </span>
            <button
              type="button"
              onClick={handleAltTextCancel}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="이미지 설명을 입력하세요"
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAltTextSave();
              } else if (e.key === "Escape") {
                handleAltTextCancel();
              }
            }}
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleAltTextCancel}
              className="rounded px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleAltTextSave}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              저장
            </button>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            대체 텍스트는 스크린 리더 사용자와 이미지를 볼 수 없는 사용자를 위한 설명입니다.
          </p>
        </div>
      )}
    </div>
  );
}
