import type { JSONContent } from "@tiptap/core";

export type FlatScreenplayNodeType =
  | "sceneHeading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "general";

export type ProjectionNodeRef = {
  nodeIndex: number;
  nodeType: FlatScreenplayNodeType;
  textContent: string;
  node: JSONContent;
};

export type DialogueSpeechSegmentProjection = {
  kind: "dialogue" | "parenthetical";
  ref: ProjectionNodeRef;
};

export type DialogueGroupProjection = {
  kind: "dialogueGroup";
  character: ProjectionNodeRef;
  speechSegments: DialogueSpeechSegmentProjection[];
  startNodeIndex: number;
  endNodeIndex: number;
};

export type FlatBlockProjection = {
  kind: "flatBlock";
  ref: ProjectionNodeRef;
};

export type ScreenplayRenderProjection = Array<
  DialogueGroupProjection | FlatBlockProjection
>;
