import type { ScreenplayConvertibleNodeType } from "@/lib/editor/screenplay/types";
import type { ScreenplayStyleNodeKey } from "@/lib/editor/screenplayFormat/types";

export type ScreenplayNodeLabelKey = ScreenplayStyleNodeKey | "general";
export type ScreenplayNodeLabelVariant = "default" | "dropdown" | "style";

type ScreenplayNodeLabelEntry = {
  default: string;
  dropdown?: string;
  style?: string;
};

export const SCREENPLAY_NODE_LABELS_KO: Record<ScreenplayNodeLabelKey, ScreenplayNodeLabelEntry> = {
  paragraph: {
    default: "general",
    dropdown: "general",
    style: "general",
  },
  general: {
    default: "general",
    dropdown: "general",
    style: "general",
  },
  sceneHeading: {
    default: "씬 헤딩",
  },
  action: {
    default: "지문",
    style: "액션",
  },
  character: {
    default: "등장인물",
  },
  dialogue: {
    default: "대사",
  },
  parenthetical: {
    default: "괄호지시",
  },
  transition: {
    default: "전환",
    style: "트랜지션",
  },
};

export function getScreenplayNodeLabelKo(
  key: ScreenplayNodeLabelKey,
  variant: ScreenplayNodeLabelVariant = "default",
): string {
  const entry = SCREENPLAY_NODE_LABELS_KO[key];
  if (!entry) return key;
  if (variant === "dropdown") return entry.dropdown ?? entry.default;
  if (variant === "style") return entry.style ?? entry.default;
  return entry.default;
}

export const SCREENPLAY_NODE_TYPE_DROPDOWN_ORDER: ScreenplayConvertibleNodeType[] = [
  "general",
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
];

export const SCREENPLAY_STYLE_NODE_ORDER: ScreenplayStyleNodeKey[] = [
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "paragraph",
];

export function getScreenplayNodePublicKey(
  key: ScreenplayConvertibleNodeType | ScreenplayStyleNodeKey | string,
): string {
  return key;
}
