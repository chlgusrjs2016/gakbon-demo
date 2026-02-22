import type { PdfPageSettings } from "./types";

function pxToIn(px: number) {
  return `${(px / 96).toFixed(4)}in`;
}

function pageSizeCss(pageSize: PdfPageSettings["pageSize"]) {
  return pageSize === "us_letter" ? "Letter" : "A4";
}

const screenplayCss = `
.screenplay-root {
  font-family: "Courier Prime", "Nanum Gothic Coding", "Courier New", Courier, monospace;
  color: #000;
  font-size: 16px;
  line-height: 1;
  letter-spacing: 0;
}
.screenplay-root p {
  margin: 0;
  padding-left: 144px;
  padding-right: 96px;
}
.screenplay-root .scene-heading {
  position: relative;
  margin-top: 2em;
  margin-bottom: 0;
  padding-left: 144px;
  padding-right: 96px;
  text-transform: uppercase;
  counter-increment: scene-counter;
}
.screenplay-root .scene-heading::before {
  content: counter(scene-counter) ".";
  position: absolute;
  left: 96px;
}
.screenplay-root .action {
  margin-top: 1em;
  margin-bottom: 0;
  padding-left: 144px;
  padding-right: 96px;
}
.screenplay-root .character {
  margin-top: 1em;
  margin-bottom: 0;
  padding-left: 355px;
  padding-right: 298px;
  text-transform: uppercase;
}
.screenplay-root .dialogue {
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 240px;
  padding-right: 192px;
}
.screenplay-root .parenthetical {
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 298px;
  padding-right: 250px;
  font-style: normal;
}
.screenplay-root .transition-block {
  margin-top: 1em;
  margin-bottom: 0;
  padding-left: 144px;
  padding-right: 96px;
  text-align: right;
  text-transform: uppercase;
}
.screenplay-root strong,
.screenplay-root b {
  font-weight: 400 !important;
}
.screenplay-root em,
.screenplay-root i {
  font-style: normal !important;
}
`;

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
  documentType: "screenplay" | "document",
  pageSettings: PdfPageSettings,
  embeddedFontCss = ""
) {
  const { margins, pageSize } = pageSettings;
  const pageMargins = documentType === "screenplay"
    ? { top: margins.top, bottom: margins.bottom, left: 0, right: 0 }
    : margins;
  const base = `
  @page {
    size: ${pageSizeCss(pageSize)};
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

  return `${base}\n${embeddedFontCss}\n${
    documentType === "screenplay" ? screenplayCss : documentCss
  }`;
}
