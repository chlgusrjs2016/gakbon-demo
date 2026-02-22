import type { ResolvedScreenplaySpec } from "@/lib/editor/screenplayFormat/types";
import type { PdfFontKey } from "./fontRegistry";

export function selectPdfFontsForScreenplay(spec: ResolvedScreenplaySpec): PdfFontKey[] {
  const keys = new Set<PdfFontKey>(Object.values(spec.fontCoverage));
  for (const coverage of Object.values(spec.nodeEffectiveFontCoverageMap ?? {})) {
    for (const key of Object.values(coverage)) keys.add(key);
  }
  return Array.from(keys);
}
