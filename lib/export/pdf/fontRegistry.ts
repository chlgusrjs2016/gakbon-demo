import { FONT_CATALOG, type FontCatalogKey } from "@/lib/fonts/fontCatalog";

export type PdfFontKey = FontCatalogKey;

export type PdfFontFaceSource = {
  format: "woff2" | "woff";
  path: string;
};

export type PdfFontFaceDefinition = {
  key: PdfFontKey;
  family: string;
  weight: number;
  style: "normal" | "italic";
  sources: PdfFontFaceSource[];
};

export type PdfFontManifest = Record<PdfFontKey, PdfFontFaceDefinition[]>;

export const PDF_FONT_MANIFEST: PdfFontManifest = {
  courier_prime: FONT_CATALOG.courier_prime.pdf.faces.map((face) => ({
    key: "courier_prime",
    family: FONT_CATALOG.courier_prime.cssFamily,
    weight: face.weight,
    style: face.style,
    sources: face.sources,
  })),
  kopub_batang: FONT_CATALOG.kopub_batang.pdf.faces.map((face) => ({
    key: "kopub_batang",
    family: FONT_CATALOG.kopub_batang.cssFamily,
    weight: face.weight,
    style: face.style,
    sources: face.sources,
  })),
  pretendard: [],
};
