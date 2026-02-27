import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  MarkdownTable,
  MarkdownTableRow,
  MarkdownTableCell,
  MarkdownTableHeader,
} from "./extensions/MarkdownTable";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { MarkdownShortcuts } from "./extensions/MarkdownShortcuts";
import { CustomImage } from "./extensions/CustomImage";

const lowlight = createLowlight(common);

export const markdownExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false, // Replaced with CodeBlockLowlight
  }),
  MarkdownShortcuts,
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      class: "text-blue-600 underline hover:text-blue-800",
    },
  }),
  CustomImage.configure({
    inline: true,
    allowBase64: false,
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto",
    },
  }),
  MarkdownTable.configure({
    resizable: true,
    HTMLAttributes: {
      class: "border-collapse table-auto w-full markdown-table",
    },
  }),
  MarkdownTableRow,
  MarkdownTableHeader.configure({
    HTMLAttributes: {
      class: "border border-gray-300 px-4 py-2 bg-gray-100 font-semibold markdown-table-header",
    },
  }),
  MarkdownTableCell.configure({
    HTMLAttributes: {
      class: "border border-gray-300 px-4 py-2 markdown-table-cell",
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "list-none pl-0",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm",
    },
  }),
];
