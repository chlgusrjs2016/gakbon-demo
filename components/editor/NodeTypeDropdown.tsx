/**
 * 노드타입 드롭다운
 *
 * 범용 GlassDropdown 컴포넌트를 사용하여 시나리오 노드 타입을 선택합니다.
 */
"use client";

import GlassDropdown, {
  type GlassDropdownOption,
} from "@/components/ui/GlassDropdown";

const NODE_TYPE_OPTIONS: GlassDropdownOption[] = [
  { value: "paragraph", label: "일반" },
  { value: "sceneHeading", label: "씬 헤딩" },
  { value: "action", label: "지문" },
  { value: "character", label: "등장인물" },
  { value: "dialogue", label: "대사" },
  { value: "parenthetical", label: "괄호지시" },
  { value: "transition", label: "전환" },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function NodeTypeDropdown({ value, onChange }: Props) {
  return (
    <GlassDropdown
      value={value}
      options={NODE_TYPE_OPTIONS}
      onChange={onChange}
      align="center"
    />
  );
}
