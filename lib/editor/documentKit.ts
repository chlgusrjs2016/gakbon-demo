import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { DocUnderline } from "@/lib/editor/extensions/DocUnderline";
import { DocHighlight } from "@/lib/editor/extensions/DocHighlight";
import { DocTextStyle } from "@/lib/editor/extensions/DocTextStyle";
import { DocTextAlign } from "@/lib/editor/extensions/DocTextAlign";
import { DocImage } from "@/lib/editor/extensions/DocImage";
import {
  DocTable,
  DocTableCell,
  DocTableHeader,
  DocTableRow,
} from "@/lib/editor/extensions/DocTable";

export const documentExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  DocTextStyle,
  DocTextAlign,
  DocUnderline,
  DocHighlight,
  DocImage,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  DocTable,
  DocTableRow,
  DocTableHeader,
  DocTableCell,
];
