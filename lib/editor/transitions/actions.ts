import type {
  TransitionActionRegistry,
  TransitionActionSpec,
  TransitionContext,
} from "./types";

export function executeTransitionAction(
  action: TransitionActionSpec,
  ctx: TransitionContext,
  registry: TransitionActionRegistry,
): { outcome: "handled" | "allow-default" | "noop" | "failed"; error?: string } {
  if (action.kind === "noop") return { outcome: "noop" };
  if (action.kind === "allowDefault" || action.kind === "splitCurrentNodeDefault") {
    return { outcome: "allow-default" };
  }

  if (action.kind === "command") {
    const fn = registry[action.commandId];
    if (!fn) return { outcome: "failed", error: `Unknown command: ${action.commandId}` };
    const ok = fn(ctx, action.args);
    return ok ? { outcome: "handled" } : { outcome: "failed", error: `Command failed: ${action.commandId}` };
  }

  if (action.kind === "commandSequence") {
    for (const step of action.steps) {
      const fn = registry[step.commandId];
      if (!fn) return { outcome: "failed", error: `Unknown command: ${step.commandId}` };
      const ok = fn(ctx, step.args);
      if (!ok) return { outcome: "failed", error: `Command failed: ${step.commandId}` };
    }
    return { outcome: "handled" };
  }

  return { outcome: "failed", error: "Unsupported action kind" };
}
