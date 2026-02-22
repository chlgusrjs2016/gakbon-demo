import { executeTransitionAction } from "./actions";
import type {
  CustomPredicateRegistry,
  TransitionActionRegistry,
  TransitionContext,
  TransitionKey,
  TransitionPredicate,
  TransitionRule,
  TransitionRunResult,
} from "./types";

function predicateMatches(
  ctx: TransitionContext,
  predicate: TransitionPredicate,
  customPredicates?: CustomPredicateRegistry,
): boolean {
  switch (predicate.kind) {
    case "selectionEmpty":
      return ctx.selectionEmpty === predicate.equals;
    case "cursorPosition":
      return predicate.in.includes(ctx.cursorPosition);
    case "insideDialogueBlock":
      return ctx.insideDialogueBlock === predicate.equals;
    case "parentType":
      return predicate.in.includes(ctx.parentType);
    case "parentEmpty":
      return ctx.parentEmpty === predicate.equals;
    case "custom":
      return customPredicates?.[predicate.fnId]?.(ctx) ?? false;
    default:
      return false;
  }
}

function getMatchingRule(args: {
  key: TransitionKey;
  context: TransitionContext;
  rules: TransitionRule[];
  customPredicates?: CustomPredicateRegistry;
}): TransitionRule | null {
  const { key, context, rules, customPredicates } = args;

  const candidates = rules
    .filter((rule) => {
      if (rule.appliesTo.documentType !== context.documentType) return false;
      if (!rule.appliesTo.keys.includes(key)) return false;
      if (rule.appliesTo.nodeTypes && !rule.appliesTo.nodeTypes.includes(context.parentType as any)) return false;
      if (rule.appliesTo.layoutModes && context.layoutMode && !rule.appliesTo.layoutModes.includes(context.layoutMode)) return false;
      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  for (const rule of candidates) {
    const when = rule.when ?? [];
    const matched = when.every((p) => predicateMatches(context, p, customPredicates));
    if (matched) return rule;
  }

  return null;
}

export function findMatchingTransitionRule(args: {
  key: TransitionKey;
  context: TransitionContext;
  rules: TransitionRule[];
  customPredicates?: CustomPredicateRegistry;
}): TransitionRule | null {
  return getMatchingRule(args);
}

export function runTransitionForKey(args: {
  key: TransitionKey;
  context: TransitionContext;
  rules: TransitionRule[];
  registry: TransitionActionRegistry;
  customPredicates?: CustomPredicateRegistry;
}): TransitionRunResult {
  const { key, context, rules, registry, customPredicates } = args;
  const rule = getMatchingRule({ key, context, rules, customPredicates });
  if (rule) {
    const exec = executeTransitionAction(rule.action, context, registry);
    return {
      matched: true,
      consumed: rule.consumeEvent,
      ruleId: rule.id,
      outcome: exec.outcome,
      error: exec.error,
    };
  }

  return { matched: false, consumed: false, outcome: "allow-default" };
}
