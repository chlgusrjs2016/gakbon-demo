import path from "node:path";

export type FontCatalogKey = "courier_prime" | "kopub_batang" | "pretendard";

export type FontCatalogEntry = {
  key: FontCatalogKey;
  label: string;
  cssFamily: string;
  web: {
    source: "cdn" | "next-font" | "system";
    href?: string;
    faces?: Array<{
      weight: number;
      style: "normal" | "italic";
      sources: Array<{ format: "woff2" | "woff"; url: string }>;
    }>;
  };
  pdf: {
    faces: Array<{
      weight: number;
      style: "normal" | "italic";
      sources: Array<{ format: "woff2" | "woff"; path: string }>;
    }>;
  };
};

const root = process.cwd();

export const FONT_CATALOG: Record<FontCatalogKey, FontCatalogEntry> = {
  courier_prime: {
    key: "courier_prime",
    label: "Courier Prime",
    cssFamily: "Courier Prime",
    web: {
      source: "cdn",
      faces: [
        {
          weight: 400,
          style: "normal",
          sources: [
            {
              format: "woff2",
              url: "https://cdn.jsdelivr.net/npm/@fontsource/courier-prime@5.2.8/files/courier-prime-latin-400-normal.woff2",
            },
          ],
        },
      ],
    },
    pdf: {
      faces: [
        {
          weight: 400,
          style: "normal",
          sources: [
            {
              format: "woff2",
              path: path.join(
                root,
                "node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2"
              ),
            },
          ],
        },
      ],
    },
  },
  kopub_batang: {
    key: "kopub_batang",
    label: "KoPub Batang",
    cssFamily: "KoPubWorld Batang",
    web: {
      source: "cdn",
      href: "https://cdn.jsdelivr.net/npm/font-kopubworld@1.0.3/css/batang.css",
      faces: [
        {
          weight: 400,
          style: "normal",
          sources: [
            {
              format: "woff2",
              url: "https://cdn.jsdelivr.net/npm/font-kopubworld@1.0.3/fonts/KoPubWorld-Batang-Medium.woff2",
            },
          ],
        },
      ],
    },
    pdf: {
      faces: [
        {
          weight: 400,
          style: "normal",
          sources: [
            {
              format: "woff2",
              path: path.join(root, "assets/fonts/kopubworld/KoPubWorldBatangMedium.woff2"),
            },
          ],
        },
      ],
    },
  },
  pretendard: {
    key: "pretendard",
    label: "Pretendard",
    cssFamily: "Pretendard",
    web: {
      source: "cdn",
      href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
    },
    pdf: { faces: [] },
  },
};

export const FONT_CATALOG_OPTIONS = (Object.keys(FONT_CATALOG) as FontCatalogKey[]).map((key) => ({
  key,
  label: FONT_CATALOG[key].label,
}));
