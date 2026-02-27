"use client";

import GlassDropdown, { type GlassDropdownOption } from "@/components/ui/GlassDropdown";
import {
  SCREENPLAY_NODE_TYPE_DROPDOWN_ORDER,
  getScreenplayNodeLabelKo,
} from "@/lib/editor/screenplayNodeLabels";

const NODE_TYPE_OPTIONS: GlassDropdownOption[] = SCREENPLAY_NODE_TYPE_DROPDOWN_ORDER.map((value) => ({
  value,
  label: getScreenplayNodeLabelKo(value, "dropdown"),
}));

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
