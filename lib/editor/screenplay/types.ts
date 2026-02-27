export type SpeechKind = "dialogue" | "parenthetical";

export type ScreenplayConvertibleNodeType =
  | "general"
  | "sceneHeading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export type SpeechSegment = { type: SpeechKind; text: string };
