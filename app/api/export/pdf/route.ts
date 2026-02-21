import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import { createClient } from "@/lib/supabase/server";
import { serializeTiptapToHtml } from "@/lib/export/pdf/tiptapSerializer";
import { buildPdfPrintCss } from "@/lib/export/pdf/printCss";
import { renderPdfHtml } from "@/lib/export/pdf/renderHtml";
import { launchPdfBrowser } from "@/lib/export/pdf/chromium";
import type { PdfExportRequest, PdfPageSettings, PdfExportErrorCode } from "@/lib/export/pdf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function safeFilename(title: string) {
  return `${title.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "document"}.pdf`;
}

function jsonError(status: number, code: PdfExportErrorCode, message: string) {
  return NextResponse.json({ code, message }, { status });
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }

  let body: PdfExportRequest;
  try {
    body = (await req.json()) as PdfExportRequest;
  } catch {
    return jsonError(400, "INVALID_PAYLOAD", "요청 본문을 읽을 수 없습니다.");
  }

  if (!body?.projectId || !body?.documentId || !body?.documentType) {
    return jsonError(400, "INVALID_PAYLOAD", "필수 필드가 누락되었습니다.");
  }

  if (body.documentType !== "screenplay" && body.documentType !== "document") {
    return jsonError(400, "INVALID_PAYLOAD", "지원하지 않는 문서 타입입니다.");
  }

  const { data: ownedProject, error: projectError } = await supabase
    .from("projects")
    .select("id,title")
    .eq("id", body.projectId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (projectError || !ownedProject) {
    return jsonError(404, "NOT_FOUND", "프로젝트를 찾을 수 없습니다.");
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id,title,content,project_id,document_type,deleted_at")
    .eq("id", body.documentId)
    .eq("project_id", body.projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (documentError || !document) {
    return jsonError(404, "NOT_FOUND", "문서를 찾을 수 없습니다.");
  }

  const pageSettings = normalizePageSettings(body.pageSettings);
  const snapshot = normalizeSnapshot(body.contentSnapshot);
  const content = snapshot ?? (document.content as JSONContent);
  const html = serializeTiptapToHtml(body.documentType, content);
  const cssText = buildPdfPrintCss(body.documentType, pageSettings);
  const pageHtml = renderPdfHtml({
    title: document.title ?? "document",
    bodyClassName: body.documentType === "screenplay" ? "screenplay-root" : "document-root",
    cssText,
    contentHtml: html,
  });

  try {
    const browser = await launchPdfBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(pageHtml, { waitUntil: "networkidle" });
      const pdfBuffer = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });
      const filename = safeFilename(document.title ?? "document");
      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("[/api/export/pdf] failed", error);
    return jsonError(500, "PDF_RENDER_FAILED", "PDF 생성 중 오류가 발생했습니다.");
  }
}
