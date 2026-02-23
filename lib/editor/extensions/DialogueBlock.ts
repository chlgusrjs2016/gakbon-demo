import { Node } from "@tiptap/core";

export const DialogueBlock = Node.create({
  name: "dialogueBlock",

  group: "block",
  content: "character? speechFlow",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: "div[data-type='dialogue-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "dialogue-block",
        class: "dialogue-block",
      },
      ["div", { class: "dialogue-block__content" }, 0],
    ];
  },
});
