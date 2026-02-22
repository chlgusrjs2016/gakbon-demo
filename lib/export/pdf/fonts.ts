import fs from "node:fs/promises";
import type { ResolvedScreenplaySpec } from "@/lib/editor/screenplayFormat/types";
import { PDF_FONT_MANIFEST, type PdfFontFaceDefinition, type PdfFontKey } from "./fontRegistry";
import { selectPdfFontsForScreenplay } from "./fontSelection";
import { buildCompositeScreenplayFontCssForAliases } from "@/lib/fonts/compositeScreenplayFont";
import { FONT_CATALOG } from "@/lib/fonts/fontCatalog";

type GetPdfEmbeddedFontCssArgs =
  | { documentType: "screenplay"; screenplaySpec: ResolvedScreenplaySpec }
  | { documentType: "document" };

const cache = new Map<string, string>();

function mimeForFormat(format: "woff2" | "woff") {
  return format === "woff2" ? "font/woff2" : "font/woff";
}

function buildFontFaceCss(def: PdfFontFaceDefinition, sourceDataUrls: string[]) {
  const src = sourceDataUrls.join(",\n       ");
  return `@font-face {\n  font-family: "${def.family}";\n  src: ${src};\n  font-style: ${def.style};\n  font-weight: ${def.weight};\n  font-display: swap;\n}`;
}

async function readSourceAsDataUrl(def: PdfFontFaceDefinition) {
  const urls: string[] = [];

  for (const source of def.sources) {
    try {
      const fileData = await fs.readFile(source.path);
      const base64 = fileData.toString("base64");
      urls.push(`url("data:${mimeForFormat(source.format)};base64,${base64}") format("${source.format}")`);
    } catch (error) {
      console.warn("[pdf/fonts] missing or unreadable font asset", {
        fontKey: def.key,
        path: source.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return urls;
}

function cacheKeyForSpec(spec: ResolvedScreenplaySpec, fontKeys: PdfFontKey[]) {
  const coverageKey = [
    spec.fontCoverage.latin,
    spec.fontCoverage.digits,
    spec.fontCoverage.punctuation,
    spec.fontCoverage.hangul,
    spec.fontCoverage.other,
  ].join(",");
  const nodeCoverageKey = Object.entries(spec.nodeEffectiveFontCoverageMap ?? {})
    .map(([node, c]) => `${node}:${c.latin}|${c.digits}|${c.punctuation}|${c.hangul}|${c.other}`)
    .sort()
    .join(";");
  return `${fontKeys.slice().sort().join("|")}::${coverageKey}::${nodeCoverageKey}`;
}

function warnIfSpecFontFamilyMismatch(spec: ResolvedScreenplaySpec, fontKeys: PdfFontKey[]) {
  if (process.env.NODE_ENV === "production") return;
  const baseFamily = spec.visual.base.fontFamily;
  for (const key of fontKeys) {
    const entry = FONT_CATALOG[key];
    if (entry && !baseFamily.includes("Screenplay Composite") && !baseFamily.includes(entry.cssFamily)) {
      console.warn("[pdf/fonts] screenplay base fontFamily does not include embedded family", {
        formatKey: spec.formatKey,
        baseFamily,
        embeddedFamily: entry.cssFamily,
        fontKey: key,
      });
    }
  }
}

async function buildScreenplayEmbeddedFontCss(spec: ResolvedScreenplaySpec) {
  const fontKeys = selectPdfFontsForScreenplay(spec);
  warnIfSpecFontFamilyMismatch(spec, fontKeys);
  const parts: string[] = [];
  const pdfDataUrlMap: Partial<Record<PdfFontKey, string>> = {};

  for (const key of fontKeys) {
    const defs = PDF_FONT_MANIFEST[key];
    if (!defs || defs.length === 0) {
      console.warn("[pdf/fonts] missing font manifest entry", { fontKey: key });
      continue;
    }
    for (const def of defs) {
      const sourceDataUrls = await readSourceAsDataUrl(def);
      if (sourceDataUrls.length === 0) continue;
      parts.push(buildFontFaceCss(def, sourceDataUrls));
      if (!pdfDataUrlMap[key]) {
        pdfDataUrlMap[key] = sourceDataUrls[0];
      }
    }
  }

  const aliasDefinitions = [
    { alias: "Screenplay Composite", coverage: spec.fontCoverage },
    ...Object.entries(spec.nodeEffectiveFontCoverageMap ?? {}).map(([nodeKey, coverage]) => ({
      alias: (spec.nodeCompositeFontFamilies?.[nodeKey as keyof typeof spec.nodeCompositeFontFamilies] ?? "")
        .replace(/^"/, "")
        .replace(/", Pretendard, sans-serif$/, ""),
      coverage,
    })),
  ].filter((v, i, arr) => v.alias && arr.findIndex((x) => x.alias === v.alias) === i);

  const composite = buildCompositeScreenplayFontCssForAliases({
    aliases: aliasDefinitions,
    mode: "pdf",
    pdfDataUrls: pdfDataUrlMap,
  });

  return [parts.join("\n\n"), composite.cssText].filter(Boolean).join("\n\n");
}

export async function getPdfEmbeddedFontCss(args: GetPdfEmbeddedFontCssArgs): Promise<string> {
  if (args.documentType !== "screenplay") return "";

  const fontKeys = selectPdfFontsForScreenplay(args.screenplaySpec);
  const key = cacheKeyForSpec(args.screenplaySpec, fontKeys);
  if (cache.has(key)) return cache.get(key) ?? "";

  try {
    const css = await buildScreenplayEmbeddedFontCss(args.screenplaySpec);
    cache.set(key, css);
    return css;
  } catch (error) {
    console.error("[pdf/fonts] failed to build embedded screenplay font css", error);
    return "";
  }
}
