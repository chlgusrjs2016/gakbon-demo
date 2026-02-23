export type SpeechKind = "dialogue" | "parenthetical";

export type ScreenplayConvertibleNodeType =
  | "paragraph"
  | "sceneHeading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export type SpeechSegment = { type: SpeechKind; text: string };

