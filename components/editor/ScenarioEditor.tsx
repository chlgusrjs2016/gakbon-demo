/**
 * 시나리오 에디터 컴포넌트
 *
 * TipTap을 사용한 리치 텍스트 에디터입니다.
 * 시나리오 전용 노드 타입(씬 헤딩, 지문, 대사 등)이 포함되어 있습니다.
 *
 * 툴바는 이 컴포넌트 바깥(EditorPage 헤더)에 있으므로,
 * editor 인스턴스를 onEditorReady 콜백으로 부모에게 전달합니다.
 */
"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { scenarioExtensions } from "@/lib/editor/scenarioKit";
import type { JSONContent, Editor } from "@tiptap/react";

type ScenarioEditorProps = {
  content: JSONContent | null;
  onUpdate?: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
};

export default function ScenarioEditor({
  content,
  onUpdate,
  onEditorReady,
}: ScenarioEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        codeBlock: false,
        horizontalRule: false,
        heading: { levels: [1, 2, 3] },
        italic: false,
      }),
      Placeholder.configure({
        placeholder: "시나리오를 작성하세요...",
      }),
      ...scenarioExtensions,
    ],

    content: content ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },

    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getJSON());
      }
    },

    autofocus: "end",

    editorProps: {
      attributes: {
        class: "scenario-editor-content",
      },
    },
  });

  // 에디터 인스턴스가 준비되면 부모에게 전달
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
    <div className="scenario-editor relative">
      <EditorContent editor={editor} />
    </div>
  );
}
