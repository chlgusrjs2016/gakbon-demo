import type { ScreenplayFontGroup } from "@/lib/editor/screenplayFormat/types";

export const SCREENPLAY_UNICODE_RANGES: Record<ScreenplayFontGroup, string[]> = {
  latin: ["U+0041-005A", "U+0061-007A", "U+00C0-024F"],
  digits: ["U+0030-0039"],
  punctuation: ["U+0020-002F", "U+003A-0040", "U+005B-0060", "U+007B-007E"],
  hangul: ["U+1100-11FF", "U+3130-318F", "U+AC00-D7A3"],
  other: ["U+2E80-2EFF", "U+2F00-2FDF", "U+3400-4DBF", "U+4E00-9FFF", "U+F900-FAFF"],
};
