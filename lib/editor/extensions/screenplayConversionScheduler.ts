import type { Editor } from "@tiptap/core";
import type { ScreenplayConvertibleNodeType } from "../screenplay/types";
export type { ScreenplayConvertibleNodeType } from "../screenplay/types";

type QueueState = {
  running: boolean;
  pendingTarget: ScreenplayConvertibleNodeType | null;
};

const conversionQueues = new WeakMap<Editor, QueueState>();

function isMismatchedTransactionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    typeof error.message === "string" &&
    error.message.includes("Applying a mismatched transaction")
  );
}

function debugSnapshot(editor: Editor) {
  try {
    const { $from } = editor.state.selection;
    return {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
      parentType: $from.parent.type.name,
      parentOffset: $from.parentOffset,
    };
  } catch {
    return { from: -1, to: -1, parentType: "unknown", parentOffset: -1 };
  }
}

export function scheduleScreenplayNodeConversion(
  editor: Editor,
  targetType: ScreenplayConvertibleNodeType,
  source: "tab" | "dropdown" | "unknown" = "unknown",
) {
  let queue = conversionQueues.get(editor);
  if (!queue) {
    queue = { running: false, pendingTarget: null };
    conversionQueues.set(editor, queue);
  }

  queue.pendingTarget = targetType;
  if (queue.running) return;

  queue.running = true;

  const run = (attempt = 0) => {
    requestAnimationFrame(() => {
      if (editor.isDestroyed) {
        queue!.running = false;
        queue!.pendingTarget = null;
        return;
      }

      const nextTarget = queue!.pendingTarget;
      if (!nextTarget) {
        queue!.running = false;
        return;
      }
      queue!.pendingTarget = null;

      try {
        editor.commands.convertScreenplayNodeType(nextTarget);
        if (queue!.pendingTarget) {
          run(0);
          return;
        }
        queue!.running = false;
      } catch (error) {
        if (isMismatchedTransactionError(error)) {
          const snapshot = debugSnapshot(editor);
          console.warn("[screenplay-convert:mismatch]", {
            source,
            targetType: nextTarget,
            attempt,
            snapshot,
          });

          if (attempt < 5) {
            queue!.pendingTarget = queue!.pendingTarget ?? nextTarget;
            run(attempt + 1);
            return;
          }

          console.error("[screenplay-convert:drop-after-retries]", {
            source,
            targetType: nextTarget,
            snapshot,
          });
          if (queue!.pendingTarget) {
            run(0);
            return;
          }
          queue!.running = false;
          return;
        }

        queue!.running = false;
        throw error;
      }
    });
  };

  run(0);
}
