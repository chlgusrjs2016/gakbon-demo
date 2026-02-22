import type { TransitionKey, TransitionRule } from "./types";

export const screenplayTransitionRules: TransitionRule[] = [
  {
    id: "screenplay/default/enter-allow-for-regular-blocks",
    priority: 100,
    appliesTo: {
      documentType: "screenplay",
      keys: ["Enter"],
      nodeTypes: ["action", "sceneHeading", "transition", "paragraph"],
    },
    action: { kind: "allowDefault" },
    consumeEvent: false,
    description: "Regular screenplay blocks keep native Enter behavior unless overridden",
  },
  {
    id: "screenplay/default/backspace-allow-for-regular-blocks",
    priority: 100,
    appliesTo: {
      documentType: "screenplay",
      keys: ["Backspace"],
      nodeTypes: ["action", "sceneHeading", "transition", "paragraph"],
    },
    action: { kind: "allowDefault" },
    consumeEvent: false,
    description: "Regular screenplay blocks keep native Backspace behavior unless overridden",
  },
  {
    id: "screenplay/dialogue/open-paren",
    priority: 1000,
    appliesTo: { documentType: "screenplay", keys: ["("], nodeTypes: ["dialogue"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }],
    action: { kind: "command", commandId: "splitDialogueToParentheticalAtCursor" },
    consumeEvent: true,
  },
  {
    id: "screenplay/parenthetical/close-paren",
    priority: 1000,
    appliesTo: { documentType: "screenplay", keys: [")"], nodeTypes: ["parenthetical"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }],
    action: { kind: "command", commandId: "splitParentheticalToDialogueAtCursor" },
    consumeEvent: true,
  },
  {
    id: "screenplay/character/enter-focus-first-speech",
    priority: 900,
    appliesTo: { documentType: "screenplay", keys: ["Enter"], nodeTypes: ["character"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }],
    action: { kind: "command", commandId: "focusFirstSpeechSegmentOrCreate" },
    consumeEvent: true,
  },
  {
    id: "screenplay/dialogue/enter-middle-split-default",
    priority: 900,
    appliesTo: { documentType: "screenplay", keys: ["Enter"], nodeTypes: ["dialogue"] },
    when: [{ kind: "cursorPosition", in: ["middle"] }],
    action: { kind: "allowDefault" },
    consumeEvent: false,
  },
  {
    id: "screenplay/dialogue/enter-end-insert-action",
    priority: 800,
    appliesTo: { documentType: "screenplay", keys: ["Enter"], nodeTypes: ["dialogue"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }, { kind: "cursorPosition", in: ["end", "all"] }],
    action: { kind: "command", commandId: "insertActionAfterDialogueBlockAndFocus" },
    consumeEvent: true,
  },
  {
    id: "screenplay/dialogue/tab-insert-parenthetical-pair",
    priority: 800,
    appliesTo: { documentType: "screenplay", keys: ["Tab"], nodeTypes: ["dialogue"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }],
    action: { kind: "command", commandId: "insertParentheticalPairAtCursor" },
    consumeEvent: true,
  },
  {
    id: "screenplay/dialogue/tab-middle-insert-parenthetical-pair",
    priority: 810,
    appliesTo: { documentType: "screenplay", keys: ["Tab"], nodeTypes: ["dialogue"] },
    when: [
      { kind: "selectionEmpty", equals: true },
      { kind: "insideDialogueBlock", equals: true },
      { kind: "cursorPosition", in: ["middle"] },
    ],
    action: { kind: "command", commandId: "insertParentheticalPairAtCursor" },
    consumeEvent: true,
  },
  {
    id: "screenplay/parenthetical/enter-middle-noop",
    priority: 900,
    appliesTo: { documentType: "screenplay", keys: ["Enter"], nodeTypes: ["parenthetical"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }, { kind: "cursorPosition", in: ["middle"] }],
    action: { kind: "noop" },
    consumeEvent: true,
  },
  {
    id: "screenplay/parenthetical/tab-any-move-dialogue",
    priority: 800,
    appliesTo: { documentType: "screenplay", keys: ["Tab"], nodeTypes: ["parenthetical"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }],
    action: { kind: "command", commandId: "moveToOrCreateNextDialogueSegment" },
    consumeEvent: true,
  },
  {
    id: "screenplay/parenthetical/enter-end-move-dialogue",
    priority: 800,
    appliesTo: { documentType: "screenplay", keys: ["Enter"], nodeTypes: ["parenthetical"] },
    when: [{ kind: "selectionEmpty", equals: true }, { kind: "insideDialogueBlock", equals: true }, { kind: "cursorPosition", in: ["end", "all"] }],
    action: { kind: "command", commandId: "moveToOrCreateNextDialogueSegment" },
    consumeEvent: true,
  },
  {
    id: "screenplay/character/backspace-empty-delete-block",
    priority: 850,
    appliesTo: { documentType: "screenplay", keys: ["Backspace"], nodeTypes: ["character"] },
    when: [
      { kind: "selectionEmpty", equals: true },
      { kind: "insideDialogueBlock", equals: true },
      { kind: "cursorPosition", in: ["start", "all"] },
      { kind: "parentEmpty", equals: true },
    ],
    action: { kind: "command", commandId: "deleteEmptyDialogueBlockSafely" },
    consumeEvent: true,
  },
  {
    id: "screenplay/segment/backspace-empty-delete-segment",
    priority: 850,
    appliesTo: { documentType: "screenplay", keys: ["Backspace"], nodeTypes: ["dialogue", "parenthetical"] },
    when: [
      { kind: "selectionEmpty", equals: true },
      { kind: "insideDialogueBlock", equals: true },
      { kind: "cursorPosition", in: ["start", "all"] },
      { kind: "parentEmpty", equals: true },
    ],
    action: { kind: "command", commandId: "deleteEmptySegmentSafely" },
    consumeEvent: true,
  },
];

export function describeScreenplayTransitionRuleForUi(ruleId?: string, key?: TransitionKey): string {
  if (!ruleId) {
    if (key === "Enter") return "기본 줄바꿈/노드 동작";
    if (key === "Tab") return "기본 탭 동작";
    return "기본 동작";
  }

  switch (ruleId) {
    case "screenplay/character/enter-focus-first-speech":
      return "같은 대사 묶음의 첫 대사로 이동";
    case "screenplay/dialogue/enter-middle-split-default":
      return "현재 대사 노드 분리 (동일 스타일)";
    case "screenplay/dialogue/enter-end-insert-action":
      return "다음 Action 노드 생성/이동";
    case "screenplay/dialogue/tab-insert-parenthetical-pair":
    case "screenplay/dialogue/tab-middle-insert-parenthetical-pair":
      return "괄호지시 `()` 생성 후 내부로 이동";
    case "screenplay/parenthetical/enter-middle-noop":
      return "동작 없음";
    case "screenplay/parenthetical/tab-any-move-dialogue":
      return "다음 대사 노드로 이동/생성";
    case "screenplay/parenthetical/enter-end-move-dialogue":
      return "다음 대사 노드로 이동/생성";
    case "screenplay/default/enter-allow-for-regular-blocks":
      return "기본 줄바꿈/노드 동작";
    default:
      if (ruleId.includes("/backspace")) return "현재 빈 노드 안전 삭제";
      if (ruleId.includes("/open-paren")) return "괄호지시 노드로 전환";
      if (ruleId.includes("/close-paren")) return "다음 대사 노드로 전환";
      return "기본 동작";
  }
}
