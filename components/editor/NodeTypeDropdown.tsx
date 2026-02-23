"use client";

import GlassDropdown, { type GlassDropdownOption } from "@/components/ui/GlassDropdown";

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
      size="md"
      align="left"
      menuWidth={160}
      triggerMinWidth={112}
      preventDefaultOnTriggerMouseDown
      preventDefaultOnItemMouseDown
    />
  );
}
