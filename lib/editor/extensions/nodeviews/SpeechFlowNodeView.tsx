"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

export default function SpeechFlowNodeView() {
  return (
    <NodeViewWrapper as="div" className="speech-flow" data-type="speech-flow">
      <NodeViewContent as="div" className="speech-flow__content" />
    </NodeViewWrapper>
  );
}

