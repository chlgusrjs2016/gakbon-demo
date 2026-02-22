"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_PRESETS,
  createPageRenderConfig,
  resolvePageRenderConfig,
} from "./config";
import { buildPageMetrics, computeBreakMarkers } from "./breaks";
import { measureBlocks } from "./measure";
import { applyPageBreakSpacing, resetPageBreakSpacing } from "./plugin";
import type { PageMetrics, PageRenderConfig, PageSizeKey, StoredPageRenderSettings } from "./types";

type UsePageRenderArgs = {
  editor: Editor | null;
  documentType: "screenplay" | "document";
  pageSizeKey?: PageSizeKey;
  settings?: StoredPageRenderSettings | null;
  configOverride?: PageRenderConfig | null;
};

type UsePageRenderResult = {
  pageCount: number;
  canvasHeight: number;
  pageSize: { width: number; height: number };
  pageGap: number;
  margins: { top: number; bottom: number; left: number; right: number };
  rulerInches: number;
  lineNumberTopPadding: number;
  ready: boolean;
  metrics: PageMetrics;
};

const EMPTY_METRICS: PageMetrics = {
  pageCount: 1,
  canvasHeight: PAGE_SIZE_PRESETS[DEFAULT_PAGE_SIZE].height,
  breakMarkers: [],
  firstLineTop: null,
  firstNonEmptyTop: null,
};

export function usePageRender({
  editor,
  documentType,
  pageSizeKey = DEFAULT_PAGE_SIZE,
  settings,
  configOverride,
}: UsePageRenderArgs): UsePageRenderResult {
  const resolvedConfig = useMemo(
    () => configOverride ?? resolvePageRenderConfig(pageSizeKey, settings),
    [configOverride, pageSizeKey, settings]
  );
  const [metrics, setMetrics] = useState<PageMetrics>({
    ...EMPTY_METRICS,
    canvasHeight: resolvedConfig.pageHeight,
  });
  const [ready, setReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastDebugSignatureRef = useRef<string>("");

  const canAccessEditorView = useCallback(() => {
    if (!editor || editor.isDestroyed) return false;
    try {
      void editor.view.dom;
      return true;
    } catch {
      return false;
    }
  }, [editor]);

  const refresh = useCallback(() => {
    if (!canAccessEditorView()) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      if (!editor || !canAccessEditorView()) return;
      const domObserver = (
        editor.view as typeof editor.view & {
          domObserver?: { stop: () => void; start: () => void };
        }
      ).domObserver;

      domObserver?.stop();
      try {
        resetPageBreakSpacing(editor);
        const blocks = measureBlocks(editor);
        const breaks = computeBreakMarkers(blocks, resolvedConfig);

        if (documentType === "screenplay") {
          applyPageBreakSpacing(editor, breaks.breakMarkers);
        }

        const next = buildPageMetrics(blocks, resolvedConfig, breaks);
        setMetrics(next);

        if (typeof window !== "undefined" && window.location.search.includes("layoutDebug=1")) {
          const debugPayload = {
            pageCount: next.pageCount,
            breakCount: next.breakMarkers.length,
            breakPositions: next.breakMarkers.map((m) => m.blockIndex),
            policyByNode: next.breakMarkers.map((m) => `${m.nodeType}:${m.policy}`),
            firstLineTop: next.firstLineTop,
            firstNonEmptyTop: next.firstNonEmptyTop,
            blockPreview: blocks.slice(0, 12).map((b) => ({
              i: b.index,
              nodeType: b.nodeType,
              text: b.text.slice(0, 24),
              marginTop: b.marginTop,
            })),
          };
          const signature = JSON.stringify(debugPayload);
          if (signature !== lastDebugSignatureRef.current) {
            lastDebugSignatureRef.current = signature;
            console.log("[layoutDebug]", debugPayload);
          }
        }
      } finally {
        domObserver?.start();
      }

      setReady(true);
    });
  }, [documentType, editor, resolvedConfig, canAccessEditorView]);

  useEffect(() => {
    if (!editor) return;
    refresh();
    editor.on("create", refresh);
    editor.on("update", refresh);
    editor.on("transaction", refresh);
    window.addEventListener("resize", refresh);

    if (typeof document !== "undefined" && "fonts" in document) {
      void (document as Document & { fonts: FontFaceSet }).fonts.ready.then(refresh);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      editor.off("create", refresh);
      editor.off("update", refresh);
      editor.off("transaction", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, [editor, refresh]);

  return {
    pageCount: metrics.pageCount,
    canvasHeight: metrics.canvasHeight,
    pageSize: { width: resolvedConfig.pageWidth, height: resolvedConfig.pageHeight },
    pageGap: resolvedConfig.pageGap,
    margins: resolvedConfig.margins,
    rulerInches: resolvedConfig.pageWidth / 96,
    lineNumberTopPadding: resolvedConfig.margins.top,
    ready,
    metrics,
  };
}
