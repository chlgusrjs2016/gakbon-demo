import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";

export interface CustomImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customImage: {
      /**
       * Set an image with optional width, alignment, and alt text
       */
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        align?: "left" | "center" | "right";
      }) => ReturnType;
      /**
       * Update image attributes
       */
      updateImage: (options: {
        width?: number;
        align?: "left" | "center" | "right";
        alt?: string;
      }) => ReturnType;
    };
  }
}

export const CustomImage = Image.extend<CustomImageOptions>({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width");
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      align: {
        default: "left",
        parseHTML: (element) => {
          return element.getAttribute("data-align") || "left";
        },
        renderHTML: (attributes) => {
          return {
            "data-align": attributes.align,
          };
        },
      },
      loading: {
        default: "lazy",
        parseHTML: (element) => element.getAttribute("loading") || "lazy",
        renderHTML: (attributes) => ({ loading: attributes.loading || "lazy" }),
      },
      decoding: {
        default: "async",
        parseHTML: (element) => element.getAttribute("decoding") || "async",
        renderHTML: (attributes) => ({ decoding: attributes.decoding || "async" }),
      },
    };
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          const attrs: Record<string, any> = {
            src: options.src,
            alt: options.alt ?? "",
            title: options.title ?? "",
          };
          
          if ("width" in options && options.width !== undefined) {
            attrs.width = options.width;
          }
          
          if ("align" in options && options.align !== undefined) {
            attrs.align = options.align;
          } else {
            attrs.align = "left";
          }
          
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
      updateImage:
        (options) =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);

          if (!node || node.type.name !== this.name) {
            return false;
          }

          return commands.updateAttributes(this.name, options);
        },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const align = node.attrs.align || "left";
    const width = node.attrs.width;

    // Determine alignment classes
    let alignClass = "";
    if (align === "center") {
      alignClass = "mx-auto block";
    } else if (align === "right") {
      alignClass = "ml-auto block";
    } else {
      alignClass = "mr-auto block";
    }

    const mergedAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      class: `${this.options.HTMLAttributes.class || ""} ${alignClass}`.trim(),
      style: width ? `width: ${width}px;` : undefined,
    });

    return ["img", mergedAttributes];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement("div");
      container.className = "image-wrapper relative group inline-block";
      container.setAttribute("data-align", node.attrs.align || "left");

      // Apply alignment to container
      const align = node.attrs.align || "left";
      if (align === "center") {
        container.style.display = "block";
        container.style.textAlign = "center";
      } else if (align === "right") {
        container.style.display = "block";
        container.style.textAlign = "right";
      } else {
        container.style.display = "block";
        container.style.textAlign = "left";
      }

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.title = node.attrs.title || "";
      img.className = "rounded-lg max-w-full h-auto cursor-pointer";

      if (node.attrs.width) {
        img.style.width = `${node.attrs.width}px`;
      }

      // Resize handles
      const resizeHandleLeft = document.createElement("div");
      resizeHandleLeft.className =
        "resize-handle resize-handle-left absolute top-1/2 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 -translate-x-1/2";

      const resizeHandleRight = document.createElement("div");
      resizeHandleRight.className =
        "resize-handle resize-handle-right absolute top-1/2 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 translate-x-1/2";

      let isResizing = false;
      let startX = 0;
      let startWidth = 0;
      let resizeDirection: "left" | "right" = "right";

      const startResize = (e: MouseEvent, direction: "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        resizeDirection = direction;
        startX = e.clientX;
        startWidth = img.offsetWidth;

        document.addEventListener("mousemove", handleResize);
        document.addEventListener("mouseup", stopResize);
      };

      const handleResize = (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = resizeDirection === "right" ? e.clientX - startX : startX - e.clientX;
        const newWidth = Math.max(100, Math.min(startWidth + deltaX, 1000));

        img.style.width = `${newWidth}px`;
      };

      const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;

        document.removeEventListener("mousemove", handleResize);
        document.removeEventListener("mouseup", stopResize);

        // Update the node attributes
        const newWidth = img.offsetWidth;
        if (typeof getPos === "function" && newWidth > 0) {
          editor.commands.updateAttributes("image", { width: Math.round(newWidth) });
        }
      };

      resizeHandleLeft.addEventListener("mousedown", (e) => startResize(e, "left"));
      resizeHandleRight.addEventListener("mousedown", (e) => startResize(e, "right"));

      // Click handler to show edit menu
      img.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof getPos === "function") {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.chain().focus().setNodeSelection(pos).run();

            // Dispatch custom event to show image edit menu
            const event = new CustomEvent("image-clicked", {
              detail: {
                node,
                pos,
                getPos,
              },
            });
            container.dispatchEvent(event);
          }
        }
      });

      container.appendChild(img);
      container.appendChild(resizeHandleLeft);
      container.appendChild(resizeHandleRight);

      return {
        dom: container,
        contentDOM: null,
        update: (updatedNode) => {
          if (updatedNode.type.name !== this.name) {
            return false;
          }

          // Update image attributes
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || "";
          img.title = updatedNode.attrs.title || "";

          if (updatedNode.attrs.width) {
            img.style.width = `${updatedNode.attrs.width}px`;
          } else {
            img.style.width = "";
          }

          // Update alignment
          const align = updatedNode.attrs.align || "left";
          container.setAttribute("data-align", align);
          if (align === "center") {
            container.style.textAlign = "center";
          } else if (align === "right") {
            container.style.textAlign = "right";
          } else {
            container.style.textAlign = "left";
          }

          return true;
        },
        destroy: () => {
          resizeHandleLeft.removeEventListener("mousedown", (e) => startResize(e, "left"));
          resizeHandleRight.removeEventListener("mousedown", (e) => startResize(e, "right"));
          document.removeEventListener("mousemove", handleResize);
          document.removeEventListener("mouseup", stopResize);
        },
      };
    };
  },
});
