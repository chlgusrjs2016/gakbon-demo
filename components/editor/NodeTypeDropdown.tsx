/**
 * 노드타입 드롭다운
 *
 * Document 툴바의 폰트 선택과 동일한 느낌의 select UI를 사용합니다.
 */
"use client";

const NODE_TYPE_OPTIONS = [
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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md bg-transparent px-2 text-sm text-zinc-700 outline-none dark:text-zinc-200"
      title="스타일(노드)"
    >
      {NODE_TYPE_OPTIONS.map((node) => (
        <option key={node.value} value={node.value}>
          {node.label}
        </option>
      ))}
    </select>
  );
}
