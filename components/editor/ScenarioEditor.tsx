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
import type { CSSProperties } from "react";

const SCREENPLAY_EDITOR_RUNTIME_VERSION = "dialogueblock-dom-v4-general";

type ScenarioEditorProps = {
  content: JSONContent | null;
  onUpdate?: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
  style?: CSSProperties;
  fontFaceCssText?: string;
  layoutMode?: string;
};

export default function ScenarioEditor({
  content,
  onUpdate,
  onEditorReady,
  style,
  fontFaceCssText,
  layoutMode,
}: ScenarioEditorProps) {
  const editor = useEditor(
    {
      immediatelyRender: false,

      extensions: [
        StarterKit.configure({
          paragraph: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
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
        content: [{ type: "general" }],
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
    },
    [SCREENPLAY_EDITOR_RUNTIME_VERSION],
  );

  // 에디터 인스턴스가 준비되면 부모에게 전달
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("layoutDebug=1")) return;

    const dump = () => {
      let editorDom: HTMLElement | null = null;
      try {
        editorDom = editor.view.dom as HTMLElement;
      } catch {
        return null;
      }
      if (!editorDom) return null;

      const root = editorDom.closest(".scenario-editor") as HTMLElement | null;
      const blocks = Array.from(editorDom.children) as HTMLElement[];
      const getSemanticRoot = (el: HTMLElement) =>
        (el.matches("[data-type='dialogue-block'], .dialogue-block, .node-dialogueBlock")
          ? el
          : (el.querySelector(
              ":scope > [data-type='dialogue-block'], :scope > .dialogue-block, :scope > .node-dialogueBlock",
            ) as HTMLElement | null)) ??
        (el.querySelector("[data-type='dialogue-block'], .dialogue-block, .node-dialogueBlock") as HTMLElement | null) ??
        (el.matches("[data-type]")
          ? el
          : (el.querySelector(":scope > [data-type]") as HTMLElement | null)) ??
        el;
      const dialogueBlocks = blocks
        .map((el) => getSemanticRoot(el))
        .filter(
          (el) =>
            el.getAttribute("data-type") === "dialogue-block" || el.classList.contains("node-dialogueBlock"),
        );

      const summary = dialogueBlocks.slice(0, 10).map((block, idx) => {
        const content = block.querySelector(":scope > .dialogue-block__content") as HTMLElement | null;
        const character = content?.querySelector(":scope > [data-type='character']") as HTMLElement | null;
        const speechFlow = content?.querySelector(":scope > [data-type='speech-flow']") as HTMLElement | null;
        const speechFlowContent = speechFlow?.querySelector(":scope > .speech-flow__content") as HTMLElement | null;
        const speechChildren = Array.from(
          (speechFlowContent ?? speechFlow ?? document.createElement("div")).children,
        ) as HTMLElement[];

        const cs = (el: HTMLElement | null) => (el ? window.getComputedStyle(el) : null);
        const cc = cs(character);
        const sc = cs(speechFlow);
        const sfc = cs(speechFlowContent);

        return {
          i: idx,
          topLevelIndex: blocks.indexOf(block),
          blockDataType: block.getAttribute("data-type"),
          blockClasses: block.className,
          blockOuterTag: block.tagName,
          blockOuterHtmlSnippet: block.outerHTML.slice(0, 240),
          contentExists: Boolean(content),
          characterExists: Boolean(character),
          speechFlowExists: Boolean(speechFlow),
          speechFlowContentExists: Boolean(speechFlowContent),
          characterText: character?.textContent?.trim() ?? "",
          speechChildTypes: speechChildren.map((n) => n.getAttribute("data-type") || n.tagName),
          characterComputed: cc
            ? {
                display: cc.display,
                marginTop: cc.marginTop,
                marginBottom: cc.marginBottom,
                paddingLeft: cc.paddingLeft,
                paddingRight: cc.paddingRight,
                width: cc.width,
              }
            : null,
          speechFlowComputed: sc
            ? {
                display: sc.display,
                marginTop: sc.marginTop,
                paddingLeft: sc.paddingLeft,
                width: sc.width,
              }
            : null,
          speechFlowContentComputed: sfc
            ? {
                display: sfc.display,
                flexWrap: sfc.flexWrap,
                alignItems: sfc.alignItems,
                width: sfc.width,
              }
            : null,
          speechChildrenComputed: speechChildren.slice(0, 5).map((n) => {
            const c = cs(n);
            return {
              type: n.getAttribute("data-type"),
              text: (n.textContent ?? "").trim(),
              display: c?.display,
              marginTop: c?.marginTop,
              paddingLeft: c?.paddingLeft,
              width: c?.width,
              flex: c?.flex,
            };
          }),
        };
      });

      const payload = {
        layoutMode: root?.dataset.layoutMode ?? null,
        totalTopLevelBlocks: blocks.length,
        dialogueBlockCount: dialogueBlocks.length,
        topLevelDivSnippets: blocks
          .filter((b) => b.tagName === "DIV")
          .slice(0, 8)
          .map((b) => b.outerHTML.slice(0, 240)),
        firstTopLevelTypes: blocks.slice(0, 20).map((b) => {
          const semantic = getSemanticRoot(b);
          return semantic.getAttribute("data-type") || semantic.className || b.tagName;
        }),
        dialogueBlocks: summary,
      };

      console.log("[dialogueBlockDebug]", payload);
      return payload;
    };

    (window as any).__dumpDialogueBlocks = dump;
    (window as any).__dumpEditorJson = () => {
      const json = editor.getJSON();
      console.log("[dialogueBlockDebug:json]", json);
      return json;
    };
    (window as any).__dumpTopLevelEditorDivs = () => {
      let editorDom: HTMLElement | null = null;
      try {
        editorDom = editor.view.dom as HTMLElement;
      } catch {
        return [];
      }
      if (!editorDom) return [];
      const divs = (Array.from(editorDom.children) as HTMLElement[])
        .filter((el) => el.tagName === "DIV")
        .map((el, i) => ({
          i,
          className: el.className,
          dataType: el.getAttribute("data-type"),
          outerHtmlSnippet: el.outerHTML.slice(0, 600),
        }));
      console.log("[dialogueBlockDebug:topLevelDivs]", divs);
      return divs;
    };
    (window as any).__dumpDialogueBlockAt = (targetIndex = 0) => {
      let editorDom: HTMLElement | null = null;
      try {
        editorDom = editor.view.dom as HTMLElement;
      } catch {
        return null;
      }
      if (!editorDom) return null;

      const blocks = Array.from(editorDom.children) as HTMLElement[];
      const target = blocks.filter(
        (el) =>
          el.matches("[data-type='dialogue-block'], .dialogue-block") ||
          !!el.querySelector(":scope > [data-type='dialogue-block'], :scope > .dialogue-block"),
      )[targetIndex] as HTMLElement | undefined;
      if (!target) return null;

      const semantic = (target.matches("[data-type='dialogue-block'], .dialogue-block")
        ? target
        : (target.querySelector(
            ":scope > [data-type='dialogue-block'], :scope > .dialogue-block",
          ) as HTMLElement | null)) as HTMLElement | null;
      if (!semantic) return null;

      const content = semantic.querySelector(":scope > .dialogue-block__content") as HTMLElement | null;
      const character = content?.querySelector(":scope > [data-type='character']") as HTMLElement | null;
      const speechFlow = content?.querySelector(":scope > [data-type='speech-flow']") as HTMLElement | null;
      const speechFlowContent = speechFlow?.querySelector(":scope > .speech-flow__content") as HTMLElement | null;
      const segments = Array.from((speechFlowContent ?? document.createElement("div")).children) as HTMLElement[];
      const cs = (el: HTMLElement | null) => (el ? window.getComputedStyle(el) : null);

      const payload = {
        targetIndex,
        semanticOuterHtmlSnippet: semantic.outerHTML.slice(0, 3000),
        contentClass: content?.className ?? null,
        characterComputed: (() => {
          const c = cs(character);
          return c
            ? {
                display: c.display,
                width: c.width,
                marginTop: c.marginTop,
                paddingLeft: c.paddingLeft,
                paddingRight: c.paddingRight,
                textAlign: c.textAlign,
              }
            : null;
        })(),
        speechFlowComputed: (() => {
          const c = cs(speechFlow);
          return c
            ? {
                display: c.display,
                width: c.width,
                marginTop: c.marginTop,
                paddingLeft: c.paddingLeft,
                paddingRight: c.paddingRight,
              }
            : null;
        })(),
        speechFlowContentComputed: (() => {
          const c = cs(speechFlowContent);
          return c
            ? {
                display: c.display,
                width: c.width,
                whiteSpace: c.whiteSpace,
                textAlign: c.textAlign,
                justifyContent: c.justifyContent,
                alignItems: c.alignItems,
              }
            : null;
        })(),
        segments: segments.map((seg, i) => {
          const c = cs(seg);
          const child = seg.firstElementChild as HTMLElement | null;
          const cc = cs(child);
          return {
            i,
            tag: seg.tagName,
            className: seg.className,
            dataType: seg.getAttribute("data-type"),
            text: (seg.textContent ?? "").slice(0, 120),
            computed: c
              ? {
                  display: c.display,
                  width: c.width,
                  marginLeft: c.marginLeft,
                  marginRight: c.marginRight,
                  fontSize: c.fontSize,
                  paddingLeft: c.paddingLeft,
                  paddingRight: c.paddingRight,
                  textAlign: c.textAlign,
                  flex: c.flex,
                }
              : null,
            child0: child
              ? {
                  className: child.className,
                  dataType: child.getAttribute("data-type"),
                  text: (child.textContent ?? "").slice(0, 120),
                  computed: cc
                    ? {
                        display: cc.display,
                        width: cc.width,
                        marginLeft: cc.marginLeft,
                        marginRight: cc.marginRight,
                        fontSize: cc.fontSize,
                        paddingLeft: cc.paddingLeft,
                        paddingRight: cc.paddingRight,
                        textAlign: cc.textAlign,
                        flex: cc.flex,
                      }
                    : null,
                }
              : null,
            outerHtmlSnippet: seg.outerHTML.slice(0, 800),
          };
        }),
      };

      const segmentsCompact = payload.segments.map((s: any) => ({
        i: s.i,
        dataType: s.dataType ?? s.child0?.dataType ?? null,
        text: s.text || s.child0?.text || "",
        display: s.computed?.display ?? s.child0?.computed?.display ?? null,
        marginLeft: s.computed?.marginLeft ?? s.child0?.computed?.marginLeft ?? null,
        fontSize: s.computed?.fontSize ?? s.child0?.computed?.fontSize ?? null,
        width: s.computed?.width ?? s.child0?.computed?.width ?? null,
      }));

      const gapPairs = segmentsCompact.slice(1).map((curr: any, idx: number) => ({
        prevI: segmentsCompact[idx]?.i,
        prevType: segmentsCompact[idx]?.dataType,
        currI: curr.i,
        currType: curr.dataType,
        currMarginLeft: curr.marginLeft,
      }));

      console.log("[dialogueBlockDebug:blockAt]", payload);
      console.table(segmentsCompact);
      console.table(gapPairs);
      return payload;
    };

    (window as any).__debugSpeechGapCss = () => {
      const rows: Array<{ sheet: number; rule: number; selector: string; marginLeft: string }> = [];
      Array.from(document.styleSheets).forEach((sheet, sheetIndex) => {
        let cssRules: CSSRuleList;
        try {
          cssRules = (sheet as CSSStyleSheet).cssRules;
        } catch {
          return;
        }
        Array.from(cssRules).forEach((rule, ruleIndex) => {
          if (!(rule instanceof CSSStyleRule)) return;
          const selector = rule.selectorText || "";
          if (!selector.includes("speech-flow__content")) return;
          const marginLeft = rule.style.getPropertyValue("margin-left");
          if (!marginLeft) return;
          const priority = rule.style.getPropertyPriority("margin-left");
          rows.push({
            sheet: sheetIndex,
            rule: ruleIndex,
            selector,
            marginLeft: `${marginLeft}${priority ? ` !${priority}` : ""}`,
          });
        });
      });
      console.table(rows);
      return rows;
    };

    const raf = requestAnimationFrame(() => {
      dump();
    });
    const onUpdate = () => {
      requestAnimationFrame(() => {
        dump();
      });
    };
    editor.on("update", onUpdate);

    return () => {
      cancelAnimationFrame(raf);
      editor.off("update", onUpdate);
      try {
        delete (window as any).__dumpDialogueBlocks;
        delete (window as any).__dumpEditorJson;
        delete (window as any).__dumpTopLevelEditorDivs;
        delete (window as any).__dumpDialogueBlockAt;
        delete (window as any).__debugSpeechGapCss;
      } catch {
        // no-op
      }
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <div className="scenario-editor relative" style={style} data-layout-mode={layoutMode}>
      {fontFaceCssText ? <style>{fontFaceCssText}</style> : null}
      <EditorContent editor={editor} />
    </div>
  );
}
