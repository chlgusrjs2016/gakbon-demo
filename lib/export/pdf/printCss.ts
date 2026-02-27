import type { PdfPageSettings } from "./types";
import type { ResolvedScreenplaySpec } from "@/lib/editor/screenplayFormat/types";
import { buildScreenplayPdfCssFromSpec } from "@/lib/editor/screenplayFormat/toPdfCss";
import { buildMarkdownPdfCss } from "./markdownSerializer";

function pxToIn(px: number) {
  return `${(px / 96).toFixed(4)}in`;
}

function pageSizeCss(pageSize: PdfPageSettings["pageSize"]) {
  return pageSize === "us_letter" ? "Letter" : "A4";
}

const documentCss = `
.document-root {
  color: #111827;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.8;
  letter-spacing: 0.01em;
  word-break: keep-all;
}
.document-root p { margin: 0 0 0.9rem 0; }
.document-root h1 { font-size: 2rem; line-height: 1.3; font-weight: 700; margin: 1.5rem 0 0.75rem; }
.document-root h2 { font-size: 1.5rem; line-height: 1.4; font-weight: 700; margin: 1.25rem 0 0.6rem; }
.document-root h3 { font-size: 1.2rem; line-height: 1.5; font-weight: 600; margin: 1rem 0 0.5rem; }
.document-root ul, .document-root ol { margin: 0 0 0.9rem; padding-left: 1.5rem; }
.document-root ul { list-style: disc; }
.document-root ol { list-style: decimal; }
.document-root mark { padding: 0 0.08em; border-radius: 0.15em; }
.document-root a { color: #2563eb; text-decoration: underline; }
.document-root img { display: block; max-width: 100%; height: auto; margin: 1rem auto; page-break-inside: avoid; }
.document-root .doc-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 1rem 0; page-break-inside: avoid; }
.document-root .doc-table td, .document-root .doc-table th {
  border: 1px solid #d4d4d8;
  padding: 0.5rem 0.625rem;
  vertical-align: top;
  background: #fff;
  min-height: 44px;
}
.document-root .doc-table th { background: #f4f4f5; font-weight: 600; }
`;

export function buildPdfPrintCss(
  documentType: "screenplay" | "document" | "md",
  pageSettings: PdfPageSettings,
  embeddedFontCss = "",
  screenplaySpec?: ResolvedScreenplaySpec | null
) {
  const { margins, pageSize } = pageSettings;
  const effectivePageSize =
    documentType === "screenplay" && screenplaySpec
      ? (screenplaySpec.paper.key as PdfPageSettings["pageSize"])
      : pageSize;
  const pageMargins =
    documentType === "screenplay" && screenplaySpec
      ? {
          top: screenplaySpec.paper.defaultMargins.top,
          bottom: screenplaySpec.paper.defaultMargins.bottom,
          left: 0,
          right: 0,
        }
      : documentType === "screenplay"
        ? { top: margins.top, bottom: margins.bottom, left: 0, right: 0 }
        : margins;
  const base = `
  @page {
    size: ${documentType === "screenplay" && screenplaySpec ? screenplaySpec.paper.pageCssSize : pageSizeCss(effectivePageSize)};
    margin-top: ${pxToIn(pageMargins.top)};
    margin-bottom: ${pxToIn(pageMargins.bottom)};
    margin-left: ${pxToIn(pageMargins.left)};
    margin-right: ${pxToIn(pageMargins.right)};
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-root { width: 100%; box-sizing: border-box; }
  `;

  const screenplayCss = screenplaySpec ? buildScreenplayPdfCssFromSpec(screenplaySpec) : "";
  const markdownCss = buildMarkdownPdfCss();
  return `${base}\n${embeddedFontCss}\n${
    documentType === "screenplay" ? screenplayCss : documentType === "md" ? markdownCss : documentCss
  }`;
}
