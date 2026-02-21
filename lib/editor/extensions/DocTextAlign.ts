import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docTextAlign: {
      setTextAlign: (alignment: "left" | "center" | "right" | "justify") => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}

type Align = "left" | "center" | "right" | "justify";

export const DocTextAlign = Extension.create({
  name: "textAlign",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote"],
      alignments: ["left", "center", "right", "justify"] as Align[],
      defaultAlignment: "left" as Align,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.textAlign || null,
            renderHTML: (attributes: { textAlign?: Align | null }) =>
              attributes.textAlign && attributes.textAlign !== this.options.defaultAlignment
                ? { style: `text-align: ${attributes.textAlign}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment) =>
        ({ tr, state, dispatch }) => {
          if (!this.options.alignments.includes(alignment)) return false;

          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, textAlign: alignment }, node.marks);
          });

          if (dispatch) dispatch(tr);
          return true;
        },

      unsetTextAlign:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, textAlign: null }, node.marks);
          });

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});
