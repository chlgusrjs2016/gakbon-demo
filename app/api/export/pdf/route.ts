import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import { createClient } from "@/lib/supabase/server";
import { serializeTiptapToHtml } from "@/lib/export/pdf/tiptapSerializer";
import { buildPdfPrintCss } from "@/lib/export/pdf/printCss";
import { renderPdfHtml } from "@/lib/export/pdf/renderHtml";
import { renderPdfWithChromium } from "@/lib/export/pdf/chromium";
import { getPdfEmbeddedFontCss } from "@/lib/export/pdf/fonts";
import type { PdfExportRequest, PdfPageSettings } from "@/lib/export/pdf/types";
import { resolveScreenplaySpecFromSources } from "@/lib/editor/screenplayFormat/resolve";
import { unwrapDialogueBlocks } from "@/lib/editor/screenplayProjection/unwrapDialogueBlocks";
import { inflateDialogueBlocks } from "@/lib/editor/screenplayRuntime/inflateDialogueBlocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function safePart(title: string) {
  return title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim();
}

function safeFilename(projectTitle: string, documentTitle: string) {
  const project = safePart(projectTitle) || "project";
  const document = safePart(documentTitle) || "document";
  return `${project}_${document}.pdf`;
}

function normalizeSnapshot(snapshot: unknown): JSONContent | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const maybeDoc = snapshot as { type?: string };
  if (maybeDoc.type !== "doc") return null;
  return snapshot as JSONContent;
}

function normalizePageSettings(input: unknown): PdfPageSettings {
  const fallback: PdfPageSettings = {
    pageSize: "a4",
    margins: { top: 96, bottom: 96, left: 96, right: 96 },
  };
  if (!input || typeof input !== "object") return fallback;
  const src = input as Partial<PdfPageSettings>;
  return {
    pageSize: src.pageSize === "us_letter" ? "us_letter" : "a4",
    margins: {
      top: typeof src.margins?.top === "number" ? src.margins.top : fallback.margins.top,
      bottom: typeof src.margins?.bottom === "number" ? src.margins.bottom : fallback.margins.bottom,
      left: typeof src.margins?.left === "number" ? src.margins.left : fallback.margins.left,
      right: typeof src.margins?.right === "number" ? src.margins.right : fallback.margins.right,
    },
  };
}

export async function POST(req: Request) {
  const debugMode = new URL(req.url).searchParams.get("debug") === "1";
  const debugId = crypto.randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "로그인이 필요합니다.", debugId },
      { status: 401 }
    );
  }

  let body: PdfExportRequest;
  try {
    body = (await req.json()) as PdfExportRequest;
  } catch {
    return NextResponse.json(
      { code: "INVALID_PAYLOAD", message: "요청 본문을 읽을 수 없습니다.", debugId },
      { status: 400 }
    );
  }

  if (!body?.projectId || !body?.documentId || !body?.documentType) {
    return NextResponse.json(
      { code: "INVALID_PAYLOAD", message: "필수 필드가 누락되었습니다.", debugId },
      { status: 400 }
    );
  }

  if (body.documentType !== "screenplay" && body.documentType !== "document") {
    return NextResponse.json(
      { code: "INVALID_PAYLOAD", message: "지원하지 않는 문서 타입입니다.", debugId },
      { status: 400 }
    );
  }

  const { data: ownedProject, error: projectError } = await supabase
    .from("projects")
    .select("id,title")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (projectError || !ownedProject) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "프로젝트를 찾을 수 없습니다.", debugId },
      { status: 404 }
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id,title,content,project_id,document_type,deleted_at")
    .eq("id", body.documentId)
    .eq("project_id", body.projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "문서를 찾을 수 없습니다.", debugId },
      { status: 404 }
    );
  }

  const pageSettings = normalizePageSettings(body.pageSettings);
  const snapshot = normalizeSnapshot(body.contentSnapshot);
  const rawContent = snapshot ?? (document.content as JSONContent);
  const canonicalContent =
    body.documentType === "screenplay"
      ? (unwrapDialogueBlocks(rawContent) ?? rawContent)
      : rawContent;
  const content =
    body.documentType === "screenplay"
      ? (inflateDialogueBlocks(canonicalContent) ?? canonicalContent)
      : canonicalContent;
  let screenplaySpec = null;
  if (body.documentType === "screenplay") {
    const { data: screenplaySettings } = await supabase
      .from("document_screenplay_render_settings")
      .select("format_key,custom_format_id,visual_overrides,break_policy_overrides")
      .eq("document_id", body.documentId)
      .maybeSingle();
    let customFormat: {
      id: string;
      base_format_key: "us" | "kr";
      font_coverage: Record<string, unknown>;
      base_font_size?: number | null;
      node_font_coverage_overrides?: Record<string, unknown> | null;
    } | null = null;
    if (screenplaySettings?.custom_format_id) {
      const { data: customData } = await supabase
        .from("user_screenplay_custom_formats")
        .select("id,base_format_key,font_coverage,base_font_size,node_font_coverage_overrides")
        .eq("id", screenplaySettings.custom_format_id)
        .eq("user_id", user.id)
        .maybeSingle();
      customFormat = (customData as typeof customFormat) ?? null;
    }
      const normalizedScreenplaySettings = screenplaySettings
      ? {
          format_key: screenplaySettings.format_key === "kr" ? ("kr" as const) : ("us" as const),
          custom_format_id: (screenplaySettings.custom_format_id as string | null | undefined) ?? null,
          visual_overrides: (screenplaySettings.visual_overrides ?? null) as Record<string, unknown> | null,
          break_policy_overrides: (screenplaySettings.break_policy_overrides ?? null) as Record<string, unknown> | null,
        }
      : null;
    screenplaySpec = resolveScreenplaySpecFromSources({
      settingsRow: normalizedScreenplaySettings as never,
      customFormatRow: (customFormat as never) ?? null,
    });
  }
  const html = serializeTiptapToHtml(body.documentType, content);
  const embeddedFontCss = await getPdfEmbeddedFontCss(
    body.documentType === "screenplay" && screenplaySpec
      ? { documentType: "screenplay", screenplaySpec }
      : { documentType: "document" }
  );
  const cssText = buildPdfPrintCss(body.documentType, pageSettings, embeddedFontCss, screenplaySpec);
  const pageHtml = renderPdfHtml({
    title: document.title ?? "document",
    bodyClassName: body.documentType === "screenplay" ? "screenplay-root" : "document-root",
    cssText,
    contentHtml: html,
  });

  try {
    const pdfBuffer = await renderPdfWithChromium(pageHtml);
    const filename = safeFilename(
      ownedProject.title ?? "project",
      document.title ?? "document"
    );
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
        "X-PDF-Debug-ID": debugId,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[/api/export/pdf] failed", {
      debugId,
      errorMessage,
      documentId: body.documentId,
      projectId: body.projectId,
    });
    const detail = debugMode ? errorMessage : undefined;
    return NextResponse.json(
      {
        code: "PDF_RENDER_FAILED",
        message: `PDF 생성 중 오류가 발생했습니다. (debugId: ${debugId})`,
        debugId,
        detail,
      },
      { status: 500 }
    );
  }
}
