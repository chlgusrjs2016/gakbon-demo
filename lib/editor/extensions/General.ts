import { Node } from "@tiptap/core";

export const General = Node.create({
  name: "general",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [
      { tag: "p[data-type='general']" },
      { tag: "p" },
      { tag: "div[data-type='general']" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "p",
      {
        ...HTMLAttributes,
        "data-type": "general",
        class: ["general", HTMLAttributes.class].filter(Boolean).join(" "),
      },
      0,
    ];
  },
});

