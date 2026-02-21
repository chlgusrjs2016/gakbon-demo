type RenderPdfHtmlArgs = {
  title: string;
  bodyClassName: string;
  cssText: string;
  contentHtml: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPdfHtml({
  title,
  bodyClassName,
  cssText,
  contentHtml,
}: RenderPdfHtmlArgs) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${cssText}</style>
  </head>
  <body>
    <main class="print-root ${bodyClassName}">
      ${contentHtml}
    </main>
  </body>
</html>`;
}
