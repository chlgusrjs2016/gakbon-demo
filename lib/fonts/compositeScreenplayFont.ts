import { FONT_CATALOG, type FontCatalogKey } from "./fontCatalog";
import { SCREENPLAY_UNICODE_RANGES } from "./unicodeRanges";
import type { ScreenplayFontCoverageMap } from "@/lib/editor/screenplayFormat/types";

export const SCREENPLAY_COMPOSITE_FONT_FAMILY = "Screenplay Composite";

type CompositeMode = "web" | "pdf";
export type CompositeModeType = CompositeMode;

type PdfDataUrlMap = Partial<Record<FontCatalogKey, string>>;
export type ScreenplayCompositeAliasDefinition = {
  alias: string;
  coverage: ScreenplayFontCoverageMap;
};

function escapeFamily(value: string) {
  return value.replaceAll('"', '\\"');
}

function buildSrcForMode(fontKey: FontCatalogKey, mode: CompositeMode, pdfDataUrls: PdfDataUrlMap) {
  const entry = FONT_CATALOG[fontKey];
  if (mode === "pdf") {
    const dataUrl = pdfDataUrls[fontKey];
    if (!dataUrl) return `local("${escapeFamily(entry.cssFamily)}")`;
    return `${dataUrl}, local("${escapeFamily(entry.cssFamily)}")`;
  }
  const webFace = entry.web.faces?.find((face) => face.weight === 400 && face.style === "normal") ?? entry.web.faces?.[0];
  const webSource = webFace?.sources?.[0];
  if (webSource) {
    return `url("${webSource.url}") format("${webSource.format}"), local("${escapeFamily(entry.cssFamily)}")`;
  }
  return `local("${escapeFamily(entry.cssFamily)}")`;
}

function buildAliasFace(
  alias: string,
  fontKey: FontCatalogKey,
  unicodeRanges: string[],
  mode: CompositeMode,
  pdfDataUrls: PdfDataUrlMap
) {
  const entry = FONT_CATALOG[fontKey];
  return `@font-face {\n  font-family: "${alias}";\n  src: ${buildSrcForMode(fontKey, mode, pdfDataUrls)};\n  font-style: normal;\n  font-weight: 400;\n  font-display: swap;\n  unicode-range: ${unicodeRanges.join(", ")};\n}`;
}

export function buildCompositeScreenplayFontCssForAliases(args: {
  aliases: ScreenplayCompositeAliasDefinition[];
  mode: CompositeMode;
  pdfDataUrls?: PdfDataUrlMap;
}) {
  const pdfDataUrls = args.pdfDataUrls ?? {};
  const parts: string[] = [];

  for (const aliasDef of args.aliases) {
    (Object.keys(aliasDef.coverage) as Array<keyof ScreenplayFontCoverageMap>).forEach((group) => {
      const fontKey = aliasDef.coverage[group];
      const unicodeRanges = SCREENPLAY_UNICODE_RANGES[group];
      parts.push(buildAliasFace(aliasDef.alias, fontKey, unicodeRanges, args.mode, pdfDataUrls));
    });
  }

  return {
    cssText: parts.join("\n\n"),
    compositeFontFamily: `"${SCREENPLAY_COMPOSITE_FONT_FAMILY}", Pretendard, sans-serif`,
  };
}

export function buildCompositeScreenplayFontCss(args: {
  fontCoverage: ScreenplayFontCoverageMap;
  mode: CompositeMode;
  pdfDataUrls?: PdfDataUrlMap;
}) {
  return buildCompositeScreenplayFontCssForAliases({
    aliases: [{ alias: SCREENPLAY_COMPOSITE_FONT_FAMILY, coverage: args.fontCoverage }],
    mode: args.mode,
    pdfDataUrls: args.pdfDataUrls,
  });
}
