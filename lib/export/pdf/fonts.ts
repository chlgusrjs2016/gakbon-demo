import fs from "node:fs/promises";
import path from "node:path";

let cachedScreenplayFontCss: string | null = null;

function mimeForFile(fileName: string) {
  if (fileName.endsWith(".woff2")) return "font/woff2";
  if (fileName.endsWith(".woff")) return "font/woff";
  return "application/octet-stream";
}

async function inlineFontCssFromPackage(pkgName: string, cssFileName: string) {
  const pkgRoot = path.join(process.cwd(), "node_modules", pkgName);
  const cssPath = path.join(pkgRoot, cssFileName);
  let css = await fs.readFile(cssPath, "utf8");

  const urlRegex = /url\(([^)]+)\)/g;
  const matches = Array.from(css.matchAll(urlRegex));

  for (const match of matches) {
    const raw = match[1]?.trim().replace(/^['"]|['"]$/g, "");
    if (!raw || raw.startsWith("data:") || raw.startsWith("http")) continue;
    const filePath = path.resolve(path.dirname(cssPath), raw);
    const fileData = await fs.readFile(filePath);
    const base64 = fileData.toString("base64");
    const mime = mimeForFile(filePath);
    const dataUrl = `url("data:${mime};base64,${base64}")`;
    css = css.replace(match[0], dataUrl);
  }

  return css;
}

async function buildEmbeddedScreenplayFontCss() {
  // Courier Prime: 영문/숫자/기호
  const courierCss = await inlineFontCssFromPackage("@fontsource/courier-prime", "400.css");

  // Nanum Gothic Coding: 한글 포함 모노스페이스 fallback
  const nanumCss = await inlineFontCssFromPackage(
    "@fontsource/nanum-gothic-coding",
    "400.css"
  );

  return `${courierCss}\n${nanumCss}`;
}

export async function getPdfEmbeddedFontCss(
  documentType: "screenplay" | "document"
): Promise<string> {
  if (documentType !== "screenplay") return "";
  if (cachedScreenplayFontCss) return cachedScreenplayFontCss;

  try {
    cachedScreenplayFontCss = await buildEmbeddedScreenplayFontCss();
    return cachedScreenplayFontCss;
  } catch (error) {
    console.error("[pdf/fonts] failed to embed screenplay fonts", error);
    return "";
  }
}
