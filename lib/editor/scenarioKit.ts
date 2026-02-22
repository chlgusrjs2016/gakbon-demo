/**
 * 시나리오 킷 (Scenario Kit)
 *
 * 시나리오 에디터에 필요한 모든 커스텀 노드를 한데 모은 것입니다.
 * 에디터에 이 확장들을 등록하면, 각 노드 타입을 사용할 수 있게 됩니다.
 *
 * 포함된 노드 타입:
 * 1. SceneHeading (씬 헤딩) - Ctrl+Shift+1
 * 2. Action (지문) - Ctrl+Shift+2
 * 3. Character (등장인물) - Ctrl+Shift+3
 * 4. Dialogue (대사) - Ctrl+Shift+4
 * 5. Parenthetical (괄호 지시) - Ctrl+Shift+5
 * 6. Transition (전환) - Ctrl+Shift+6
 */

import { SceneHeading } from "./extensions/SceneHeading";
import { Action } from "./extensions/Action";
import { Character } from "./extensions/Character";
import { Dialogue } from "./extensions/Dialogue";
import { Parenthetical } from "./extensions/Parenthetical";
import { Transition } from "./extensions/Transition";
import { TabCycleNodes } from "./extensions/TabCycleNodes";
import { DialogueBlock } from "./extensions/DialogueBlock";
import { SpeechFlow } from "./extensions/SpeechFlow";
import { DialogueBlockEditing } from "./extensions/DialogueBlockEditing";

export const scenarioExtensions = [
  DialogueBlock,
  SpeechFlow,
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
  DialogueBlockEditing,
  TabCycleNodes,
];

export {
  DialogueBlock,
  SpeechFlow,
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
  DialogueBlockEditing,
  TabCycleNodes,
};
