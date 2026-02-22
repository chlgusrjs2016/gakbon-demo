"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

export default function DialogueBlockNodeView() {
  return (
    <NodeViewWrapper
      as="div"
      className="dialogue-block"
      data-type="dialogue-block"
    >
      <NodeViewContent as="div" className="dialogue-block__content" />
    </NodeViewWrapper>
  );
}

