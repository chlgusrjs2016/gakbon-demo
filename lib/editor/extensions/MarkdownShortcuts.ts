import { Extension } from "@tiptap/core";
import { textblockTypeInputRule } from "@tiptap/core";

/**
 * Markdown Shortcuts Extension
 * 
 * Automatically converts markdown syntax patterns to corresponding block types:
 * - '# ', '## ', '### ' → Heading levels 1-3
 * - '- ', '* ' → Bullet List
 * - '1. ' → Ordered List
 * - '```' → Code Block
 * - '> ' → Blockquote
 * - '---' → Horizontal Rule
 * - '[ ] ', '[x] ' → Task List
 */
export const MarkdownShortcuts = Extension.create({
  name: "markdownShortcuts",

  addInputRules() {
    return [
      // Heading shortcuts: # , ## , ###
      textblockTypeInputRule({
        find: /^#\s$/,
        type: this.editor.schema.nodes.heading,
        getAttributes: () => ({ level: 1 }),
      }),
      textblockTypeInputRule({
        find: /^##\s$/,
        type: this.editor.schema.nodes.heading,
        getAttributes: () => ({ level: 2 }),
      }),
      textblockTypeInputRule({
        find: /^###\s$/,
        type: this.editor.schema.nodes.heading,
        getAttributes: () => ({ level: 3 }),
      }),

      // Blockquote shortcut: >
      textblockTypeInputRule({
        find: /^>\s$/,
        type: this.editor.schema.nodes.blockquote,
      }),

      // Code block shortcut: ```
      textblockTypeInputRule({
        find: /^```$/,
        type: this.editor.schema.nodes.codeBlock,
      }),

      // Horizontal rule shortcut: ---
      textblockTypeInputRule({
        find: /^---$/,
        type: this.editor.schema.nodes.horizontalRule,
      }),
    ];
  },
});
