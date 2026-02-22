import type { PaperPreset } from "./types";

export const PAPER_PRESETS: Record<PaperPreset["key"], PaperPreset> = {
  a4: {
    key: "a4",
    label: "A4",
    pageCssSize: "A4",
    widthPx: 794,
    heightPx: 1123,
    defaultMargins: { top: 96, right: 96, bottom: 96, left: 96 },
    defaultPageGap: 12,
  },
  us_letter: {
    key: "us_letter",
    label: "US Letter",
    pageCssSize: "Letter",
    widthPx: 816,
    heightPx: 1056,
    defaultMargins: { top: 96, right: 96, bottom: 96, left: 96 },
    defaultPageGap: 12,
  },
};
