import type { JSONContent } from "@tiptap/core";
import { unwrapDialogueBlocks } from "@/lib/editor/screenplayProjection/unwrapDialogueBlocks";

function cloneNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === "object" && "type" in (value as object));
}

function toSpeechSegments(children: JSONContent[] | undefined): JSONContent[] {
  const segments = (children ?? []).filter(
    (n) => n.type === "dialogue" || n.type === "parenthetical",
  );
  return segments.map((n) => cloneNode(n));
}

function buildDialogueBlock(characterNode: JSONContent, speechNodes?: JSONContent[]): JSONContent {
  return {
    type: "dialogueBlock",
    content: [
      cloneNode(characterNode),
      {
        type: "speechFlow",
        content: toSpeechSegments(speechNodes),
      },
    ],
  };
}

export function inflateDialogueBlocks(content: JSONContent | null | undefined): JSONContent | null {
  const canonical = unwrapDialogueBlocks(content) ?? content;
  if (!canonical || canonical.type !== "doc") return canonical ?? null;

  const src = Array.isArray(canonical.content) ? canonical.content.filter(isJsonContent) : [];
  const out: JSONContent[] = [];

  for (let i = 0; i < src.length; ) {
    const node = src[i];
    if (node.type !== "character") {
      out.push(cloneNode(node));
      i += 1;
      continue;
    }

    const speech: JSONContent[] = [];
    let j = i + 1;
    while (j < src.length) {
      const next = src[j];
      if (next.type === "dialogue" || next.type === "parenthetical") {
        speech.push(next);
        j += 1;
        continue;
      }
      break;
    }

    out.push(buildDialogueBlock(node, speech));
    i = j;
  }

  return {
    ...cloneNode(canonical),
    content: out.length > 0 ? out : [{ type: "paragraph" }],
  };
}
