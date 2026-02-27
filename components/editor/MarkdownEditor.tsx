"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent, Editor } from "@tiptap/react";
import { markdownExtensions } from "@/lib/editor/markdownKit";
import { useDebounce } from "@/lib/hooks/useDebounce";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import BlockHoverMenu from "./BlockHoverMenu";
import ImageUploadDialog from "./ImageUploadDialog";
import ImageEditMenu from "./ImageEditMenu";
import TableMenu from "./TableMenu";
import { createClient } from "@/lib/supabase/client";
import {
  createMarkdownImageUploadUrl,
  confirmMarkdownImageUpload,
} from "@/app/actions/markdownImage";

type MarkdownEditorProps = {
  content: JSONContent | null;
  onUpdate?: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
  onRequestImageUpload?: () => void;
  autoSaveDelay?: number; // Default: 1000ms
  documentId?: string; // Document ID for auto-save
  onAutoSave?: (content: JSONContent) => Promise<void>; // Auto-save callback
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

export default function MarkdownEditor({
  content,
  onUpdate,
  onEditorReady,
  onRequestImageUpload,
  autoSaveDelay = 1000,
  documentId,
  onAutoSave,
}: MarkdownEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashPos, setSlashPos] = useState({ x: 0, y: 0 });
  const [keepSlashOnBlur, setKeepSlashOnBlur] = useState(false);
  const [currentContent, setCurrentContent] = useState<JSONContent | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [blockMenuVisible, setBlockMenuVisible] = useState(false);
  const [blockMenuPos, setBlockMenuPos] = useState({ x: 0, y: 0 });
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageEditMenuVisible, setImageEditMenuVisible] = useState(false);
  const [imageEditMenuPos, setImageEditMenuPos] = useState({ x: 0, y: 0 });
  const [selectedImageNode, setSelectedImageNode] = useState<unknown>(null);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [screenReaderMessage, setScreenReaderMessage] = useState("");
  const slashOpenRef = useRef(false);
  const slashIndexRef = useRef(0);
  const filteredCommandsRef = useRef<SlashCommandItem[]>([]);
  const lastSavedContentRef = useRef<string | null>(null);
  const blockMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the content for auto-save
  const debouncedContent = useDebounce(currentContent, autoSaveDelay);

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
        id: "paragraph",
        label: "Paragraph",
        keywords: ["paragraph", "text", "단락"],
        run: (editor) => editor.chain().focus().setParagraph().run(),
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
        label: "Image",
        keywords: ["image", "사진", "이미지"],
        run: (_editor, requestImageUpload) => {
          if (requestImageUpload) {
            requestImageUpload();
          } else {
            setImageDialogOpen(true);
          }
        },
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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Placeholder.configure({
        placeholder: "마크다운 문서를 작성하세요. '/' 를 입력해 블록 명령을 열 수 있습니다.",
      }),
      GlobalDragHandle.configure({
        dragHandleWidth: 24,
        scrollTreshold: 100,
        dragHandleSelector: ".drag-handle",
      }),
      ...markdownExtensions,
    ],
    content: getInitialContent(content),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const plainText = editor.getText();
      const words = plainText.trim().length === 0 ? 0 : plainText.trim().split(/\s+/).length;
      setCharCount(plainText.length);
      setWordCount(words);
      setScreenReaderMessage(`문서 업데이트됨. 문자 ${plainText.length}자, 단어 ${words}개`);
      setCurrentContent(json);
      onUpdate?.(json);
    },
    autofocus: "end",
    editorProps: {
      attributes: {
        class: "markdown-editor-content",
        "aria-label": "Markdown editor",
      },
      handleKeyDown: (_view, event) => {
        if (!editor) return false;
        const isMod = event.metaKey || event.ctrlKey;
        const lowerKey = event.key.toLowerCase();

        if (isMod && lowerKey === "b") {
          event.preventDefault();
          editor.chain().focus().toggleBold().run();
          return true;
        }

        if (isMod && lowerKey === "i") {
          event.preventDefault();
          editor.chain().focus().toggleItalic().run();
          return true;
        }

        if (isMod && lowerKey === "u") {
          event.preventDefault();
          editor.chain().focus().toggleUnderline().run();
          return true;
        }

        if (isMod && lowerKey === "k") {
          event.preventDefault();
          const previousUrl = (editor.getAttributes("link")?.href as string | undefined) ?? "";
          const url = window.prompt("링크 URL을 입력하세요", previousUrl);
          if (url === null) return true;
          if (!url) editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
          return true;
        }

        if (isMod && event.shiftKey && lowerKey === "c") {
          event.preventDefault();
          editor.chain().focus().toggleCodeBlock().run();
          return true;
        }

        if (isMod && lowerKey === "z") {
          event.preventDefault();
          editor.chain().focus().undo().run();
          return true;
        }

        if (isMod && lowerKey === "y") {
          event.preventDefault();
          editor.chain().focus().redo().run();
          return true;
        }

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
      handleDrop: (view, event, _slice, moved) => {
        if (!documentId || moved) return false;

        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        // Check if any file is an image
        const imageFile = Array.from(files).find((file) =>
          file.type.startsWith("image/")
        );

        if (!imageFile) return false;

        event.preventDefault();

        // Upload the dropped image
        (async () => {
          try {
            const uploadMeta = await createMarkdownImageUploadUrl(
              documentId,
              imageFile.name,
              imageFile.type
            );

            if (!uploadMeta.success || !uploadMeta.url) {
              console.error("Failed to create upload URL:", uploadMeta.error);
              return;
            }

            const supabase = createClient();
            const upload = await supabase.storage
              .from("document-assets")
              .uploadToSignedUrl(uploadMeta.path!, uploadMeta.token!, imageFile);

            if (upload.error) {
              console.error("Failed to upload image:", upload.error);
              return;
            }

            const confirmed = await confirmMarkdownImageUpload({
              documentId,
              path: uploadMeta.path!,
              filename: imageFile.name,
              mimeType: imageFile.type,
              size: imageFile.size,
            });

            if (!confirmed.success || !confirmed.publicUrl) {
              console.error("Failed to confirm upload:", confirmed.error);
              return;
            }

            // Get the position where the image was dropped
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            if (coordinates) {
              const altText = window.prompt("이미지 대체 텍스트(alt)를 입력하세요", imageFile.name) ?? imageFile.name;
              editor
                ?.chain()
                .focus()
                .insertContentAt(coordinates.pos, {
                  type: "image",
                  attrs: {
                    src: confirmed.publicUrl,
                    alt: altText,
                  },
                })
                .run();
            }
          } catch (error) {
            console.error("Error dropping image:", error);
          }
        })();

        return true;
      },
      handleDOMEvents: {
        mousemove: (view, event) => {
          // Clear any existing timeout
          if (blockMenuTimeoutRef.current) {
            clearTimeout(blockMenuTimeoutRef.current);
          }

          // Find the node at the mouse position
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
          
          if (pos) {
            const $pos = view.state.doc.resolve(pos.pos);
            const node = $pos.node($pos.depth);
            
            // Only show menu for block-level nodes
            if (node && node.isBlock && $pos.depth > 0) {
              // Delay showing the menu slightly to avoid flickering
              blockMenuTimeoutRef.current = setTimeout(() => {
                const nodeStart = $pos.before($pos.depth);
                const coords = view.coordsAtPos(nodeStart);
                
                setBlockMenuPos({
                  x: coords.left - 40, // Position to the left of the block
                  y: coords.top,
                });
                setBlockMenuVisible(true);
              }, 100);
            } else {
              setBlockMenuVisible(false);
            }
          }
          
          return false;
        },
        mouseleave: () => {
          if (blockMenuTimeoutRef.current) {
            clearTimeout(blockMenuTimeoutRef.current);
          }
          setBlockMenuVisible(false);
          return false;
        },
      },
    },
  });

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

  // Handle clipboard paste for images
  const handlePaste = async (event: ClipboardEvent) => {
    if (!editor || !documentId) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if the item is an image
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        
        const file = item.getAsFile();
        if (!file) continue;

        try {
          // Upload the image
          const uploadMeta = await createMarkdownImageUploadUrl(
            documentId,
            `pasted-image.${file.type.split("/")[1]}`,
            file.type
          );

          if (!uploadMeta.success || !uploadMeta.url) {
            console.error("Failed to create upload URL:", uploadMeta.error);
            continue;
          }

          const supabase = createClient();
          const upload = await supabase.storage
            .from("document-assets")
            .uploadToSignedUrl(uploadMeta.path!, uploadMeta.token!, file);

          if (upload.error) {
            console.error("Failed to upload image:", upload.error);
            continue;
          }

          const confirmed = await confirmMarkdownImageUpload({
            documentId,
            path: uploadMeta.path!,
            filename: file.name || "pasted-image",
            mimeType: file.type,
            size: file.size,
          });

          if (!confirmed.success || !confirmed.publicUrl) {
            console.error("Failed to confirm upload:", confirmed.error);
            continue;
          }

          // Insert the image into the editor
          editor
            .chain()
            .focus()
            .setImage({
              src: confirmed.publicUrl,
              alt: window.prompt("이미지 대체 텍스트(alt)를 입력하세요", "Pasted image") ?? "Pasted image",
            })
            .run();
        } catch (error) {
          console.error("Error pasting image:", error);
        }
        
        break; // Only handle the first image
      }
    }
  };

  // Add paste event listener
  useEffect(() => {
    if (!editor || !documentId) return;

    const editorElement = editor.view.dom;
    editorElement.addEventListener("paste", handlePaste);

    // Listen for image click events
    const handleImageClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { node, pos } = customEvent.detail;

      if (node && node.type.name === "image") {
        // Get the position of the image to place the menu
        const coords = editor.view.coordsAtPos(pos);
        setImageEditMenuPos({ x: coords.left, y: coords.bottom + 8 });
        setSelectedImageNode(node);
        setImageEditMenuVisible(true);
      }
    };

    editorElement.addEventListener("image-clicked", handleImageClick);

    return () => {
      editorElement.removeEventListener("paste", handlePaste);
      editorElement.removeEventListener("image-clicked", handleImageClick);
    };
  }, [editor, documentId]);

  // Auto-save effect
  useEffect(() => {
    if (!debouncedContent || !onAutoSave) return;

    const contentString = JSON.stringify(debouncedContent);
    
    // Skip if content hasn't changed since last save
    if (contentString === lastSavedContentRef.current) return;

    setSaveStatus("saving");
    
    onAutoSave(debouncedContent)
      .then(() => {
        lastSavedContentRef.current = contentString;
        setSaveStatus("saved");
        // Reset to idle after showing "Saved" for 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
      })
      .catch((error) => {
        console.error("Auto-save failed:", error);
        setSaveStatus("idle");
      });
  }, [debouncedContent, onAutoSave]);

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
    <div className="markdown-editor relative">
      <EditorContent
        editor={editor}
        role="textbox"
        aria-multiline="true"
        onBlur={() => {
          if (keepSlashOnBlur) return;
          closeSlashMenu();
        }}
      />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {screenReaderMessage}
      </div>
      
      {/* Block Hover Menu */}
      <BlockHoverMenu
        editor={editor}
        show={blockMenuVisible}
        position={blockMenuPos}
      />
      
      {/* Table Menu */}
      <TableMenu editor={editor} />
      
      {/* Image Edit Menu */}
      <ImageEditMenu
        editor={editor}
        show={imageEditMenuVisible}
        position={imageEditMenuPos}
        imageNode={selectedImageNode}
        onClose={() => setImageEditMenuVisible(false)}
      />
      
      {/* Image Upload Dialog */}
      {documentId && (
        <ImageUploadDialog
          editor={editor}
          documentId={documentId}
          isOpen={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
        />
      )}
      
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
      {/* Save status indicator */}
      {onAutoSave && saveStatus !== "idle" && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs shadow-lg backdrop-blur-sm dark:bg-zinc-900/90">
          {saveStatus === "saving" && (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
              <span className="text-zinc-600 dark:text-zinc-300">저장 중...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <svg
                className="h-3 w-3 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-zinc-600 dark:text-zinc-300">저장됨</span>
            </>
          )}
        </div>
      )}

      <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-white/90 px-3 py-2 text-xs text-zinc-600 shadow-lg backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-300">
        문자 {charCount}자 · 단어 {wordCount}개
      </div>
    </div>
  );
}
