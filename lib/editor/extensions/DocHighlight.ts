import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docHighlight: {
      setHighlight: (color?: string) => ReturnType;
      toggleHighlight: (color?: string) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
  }
}

export const DocHighlight = Mark.create({
  name: "highlight",

  addAttributes() {
    return {
      color: {
        default: "#fde68a",
        parseHTML: (element) => element.style.backgroundColor || "#fde68a",
        renderHTML: (attributes) => ({
          style: `background-color: ${attributes.color}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: "mark" },
      {
        style: "background-color",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHighlight:
        (color = "#fde68a") =>
        ({ commands }) =>
          commands.setMark(this.name, { color }),
      toggleHighlight:
        (color = "#fde68a") =>
        ({ commands }) =>
          commands.toggleMark(this.name, { color }),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
