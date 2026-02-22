import { Node } from "@tiptap/core";

export const SpeechFlow = Node.create({
  name: "speechFlow",

  content: "(parenthetical|dialogue)+",

  parseHTML() {
    return [{ tag: "div[data-type='speech-flow']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        ...HTMLAttributes,
        "data-type": "speech-flow",
        class: "speech-flow",
      },
      ["div", { class: "speech-flow__content" }, 0],
    ];
  },
});
