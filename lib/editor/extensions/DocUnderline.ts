import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docUnderline: {
      setUnderline: () => ReturnType;
      toggleUnderline: () => ReturnType;
      unsetUnderline: () => ReturnType;
    };
  }
}

export const DocUnderline = Mark.create({
  name: "underline",

  parseHTML() {
    return [
      { tag: "u" },
      {
        style: "text-decoration",
        getAttrs: (value) =>
          typeof value === "string" && value.includes("underline") ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setUnderline:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleUnderline:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetUnderline:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
