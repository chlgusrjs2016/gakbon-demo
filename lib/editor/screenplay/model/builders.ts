/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SpeechKind, SpeechSegment } from "../types";

export function createTextNode(schema: any, typeName: string, text?: string) {
  const type = schema.nodes[typeName];
  if (!type) return null;
  if (typeof text === "string") {
    return type.create(null, text.length > 0 ? schema.text(text) : undefined);
  }
  return type.create();
}

export function createSpeechSegmentNode(schema: any, kind: SpeechKind, text = "") {
  const segType = schema.nodes[kind];
  if (!segType) return null;
  return segType.create(null, text ? schema.text(text) : undefined);
}

export function createDialogueBlockNode(
  schema: any,
  characterText = "",
  firstSpeechKind?: SpeechKind,
  firstSpeechText = "",
  options?: { omitEmptyCharacter?: boolean },
) {
  const dialogueBlockType = schema.nodes.dialogueBlock;
  const speechFlowType = schema.nodes.speechFlow;
  const characterType = schema.nodes.character;
  if (!dialogueBlockType || !speechFlowType || !characterType) return null;
  const includeCharacter = !(options?.omitEmptyCharacter && characterText.length === 0);
  const character = includeCharacter
    ? characterType.create(null, characterText ? schema.text(characterText) : undefined)
    : null;
  const children: any[] = [];
  if (firstSpeechKind) {
    const seg = createSpeechSegmentNode(schema, firstSpeechKind, firstSpeechText);
    if (!seg) return null;
    children.push(seg);
  }
  const speechFlow = speechFlowType.create(null, children);
  return dialogueBlockType.create(null, character ? [character, speechFlow] : [speechFlow]);
}

export function createDialogueBlockNodeFromSegments(
  schema: any,
  characterText: string,
  segments: SpeechSegment[],
  options?: { omitEmptyCharacter?: boolean },
) {
  const dialogueBlockType = schema.nodes.dialogueBlock;
  const speechFlowType = schema.nodes.speechFlow;
  const characterType = schema.nodes.character;
  if (!dialogueBlockType || !speechFlowType || !characterType) return null;

  const includeCharacter = !(options?.omitEmptyCharacter && characterText.length === 0);
  const character = includeCharacter
    ? characterType.create(null, characterText ? schema.text(characterText) : undefined)
    : null;
  const speechChildren = segments
    .map((seg) => createSpeechSegmentNode(schema, seg.type, seg.text))
    .filter(Boolean);
  const speechFlow = speechFlowType.create(null, speechChildren);
  return dialogueBlockType.create(null, character ? [character, speechFlow] : [speechFlow]);
}

export function createTopLevelNode(schema: any, typeName: string, text = "") {
  const type = schema.nodes[typeName];
  if (!type) return null;
  return type.create(null, text ? schema.text(text) : undefined);
}
