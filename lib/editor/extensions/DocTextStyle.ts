import { Mark, mergeAttributes } from "@tiptap/core";

type TextStyleAttrs = {
  fontFamily?: string | null;
  fontSize?: string | null;
  color?: string | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docTextStyle: {
      setFontFamily: (fontFamily: string | null) => ReturnType;
      setFontSize: (fontSize: string | null) => ReturnType;
      setTextColor: (color: string | null) => ReturnType;
      unsetTextStyle: () => ReturnType;
    };
  }
}

function buildStyle(attrs: TextStyleAttrs) {
  const styles: string[] = [];
  if (attrs.fontFamily) styles.push(`font-family: ${attrs.fontFamily}`);
  if (attrs.fontSize) styles.push(`font-size: ${attrs.fontSize}`);
  if (attrs.color) styles.push(`color: ${attrs.color}`);
  return styles.join("; ");
}

export const DocTextStyle = Mark.create({
  name: "textStyle",

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontFamily || null,
      },
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
      },
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color || null,
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[style]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const style = buildStyle(HTMLAttributes);
    const attrs = style ? { ...HTMLAttributes, style } : HTMLAttributes;
    return ["span", mergeAttributes(attrs), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ commands, editor }) => {
          const attrs = editor.getAttributes(this.name);
          return commands.setMark(this.name, {
            ...attrs,
            fontFamily,
          });
        },
      setFontSize:
        (fontSize) =>
        ({ commands, editor }) => {
          const attrs = editor.getAttributes(this.name);
          return commands.setMark(this.name, {
            ...attrs,
            fontSize,
          });
        },
      setTextColor:
        (color) =>
        ({ commands, editor }) => {
          const attrs = editor.getAttributes(this.name);
          return commands.setMark(this.name, {
            ...attrs,
            color,
          });
        },
      unsetTextStyle:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
