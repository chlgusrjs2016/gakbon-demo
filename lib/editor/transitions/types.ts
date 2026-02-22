import type { Editor } from "@tiptap/core";

export type TransitionKey = "Enter" | "Tab" | "(" | ")" | "Backspace";

export type CursorPositionKind = "start" | "middle" | "end" | "all";

export type ScreenplayNodeKind =
  | "sceneHeading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "paragraph"
  | "dialogueBlock"
  | "speechFlow";

export type LayoutMode = "us_dialogue_block" | "kr_dialogue_inline";

export type TransitionContext = {
  editor: Editor;
  state: Editor["state"];
  view: Editor["view"];
  documentType: "screenplay";
  layoutMode?: LayoutMode;
  selectionEmpty: boolean;
  parentType: string;
  parentText: string;
  parentOffset: number;
  cursorPosition: CursorPositionKind;
  isComposing: boolean;
  insideDialogueBlock: boolean;
  parentEmpty: boolean;
  dialogueBlock?: any | null;
  speechFlow?: any | null;
  segment?: any | null;
  character?: any | null;
  topLevelBlock?: any | null;
};

export type TransitionPredicate =
  | { kind: "selectionEmpty"; equals: boolean }
  | { kind: "cursorPosition"; in: CursorPositionKind[] }
  | { kind: "insideDialogueBlock"; equals: boolean }
  | { kind: "parentType"; in: string[] }
  | { kind: "parentEmpty"; equals: boolean }
  | { kind: "custom"; fnId: string };

export type TransitionActionSpec =
  | { kind: "noop" }
  | { kind: "allowDefault" }
  | { kind: "command"; commandId: string; args?: Record<string, unknown> }
  | { kind: "commandSequence"; steps: Array<{ commandId: string; args?: Record<string, unknown> }> }
  | { kind: "splitCurrentNodeDefault" };

export type TransitionRule = {
  id: string;
  priority: number;
  appliesTo: {
    documentType: "screenplay";
    nodeTypes?: ScreenplayNodeKind[];
    keys: TransitionKey[];
    layoutModes?: LayoutMode[];
  };
  when?: TransitionPredicate[];
  action: TransitionActionSpec;
  consumeEvent: boolean;
  description?: string;
};

export type TransitionRunResult = {
  matched: boolean;
  consumed: boolean;
  ruleId?: string;
  outcome: "handled" | "allow-default" | "noop" | "failed";
  error?: string;
};

export type TransitionActionHandler = (
  ctx: TransitionContext,
  args?: Record<string, unknown>,
) => boolean;

export type TransitionActionRegistry = Record<string, TransitionActionHandler>;

export type CustomPredicateRegistry = Record<string, (ctx: TransitionContext) => boolean>;
