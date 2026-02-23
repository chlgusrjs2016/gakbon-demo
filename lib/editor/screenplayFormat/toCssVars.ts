import type { CSSProperties } from "react";
import type { ResolvedScreenplaySpec, ScreenplayNodeVisualSpec } from "./types";
import { PX_PER_INCH } from "@/lib/editor/pageEngine/config";

function px(value: number) {
  return `${value}px`;
}

function normalizeSpacingScale(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 1;
  return Math.floor(value * 100) / 100;
}

function applyNodeVars(vars: Record<string, string>, prefix: string, spec: ScreenplayNodeVisualSpec) {
  vars[`--sp-${prefix}-mt`] = spec.marginTop;
  vars[`--sp-${prefix}-mb`] = spec.marginBottom;
  vars[`--sp-${prefix}-pl`] = px(spec.paddingLeft);
  vars[`--sp-${prefix}-pr`] = px(spec.paddingRight);
  if (spec.fontFamily) vars[`--sp-${prefix}-ff`] = spec.fontFamily;
  if (typeof spec.fontSize === "number") vars[`--sp-${prefix}-fs`] = px(spec.fontSize);
  if (typeof spec.lineHeight === "number") vars[`--sp-${prefix}-lh`] = String(spec.lineHeight);
  if (typeof spec.letterSpacing === "number") vars[`--sp-${prefix}-ls`] = px(spec.letterSpacing);
  if (spec.color) vars[`--sp-${prefix}-color`] = spec.color;
  if (spec.textTransform) vars[`--sp-${prefix}-tt`] = spec.textTransform;
  if (spec.textAlign) vars[`--sp-${prefix}-ta`] = spec.textAlign;
  if (typeof spec.fontWeight === "number") vars[`--sp-${prefix}-fw`] = String(spec.fontWeight);
  if (spec.fontStyle) vars[`--sp-${prefix}-fst`] = spec.fontStyle;
}

export function screenplaySpecToCssVars(spec: ResolvedScreenplaySpec): CSSProperties {
  const spacingScale = normalizeSpacingScale(spec.visual.base.spacingScale);
  const vars: Record<string, string> = {
    "--sp-base-ff": spec.compositeFontFamily || spec.visual.base.fontFamily,
    "--sp-base-fs": px(spec.visual.base.fontSize),
    "--sp-base-lh": String(spec.visual.base.lineHeight),
    "--sp-base-ls": px(spec.visual.base.letterSpacing),
    "--sp-base-color": spec.visual.base.color,
    "--sp-spacing-scale": String(spacingScale),
    "--sp-speech-inline-gap": spec.layoutMode === "kr_dialogue_inline" ? "0.5em" : "0em",
  };

  applyNodeVars(vars, "p", spec.visual.paragraph);
  applyNodeVars(vars, "scene", spec.visual.sceneHeading);
  applyNodeVars(vars, "action", spec.visual.action);
  applyNodeVars(vars, "character", spec.visual.character);
  applyNodeVars(vars, "dialogue", spec.visual.dialogue);
  applyNodeVars(vars, "parenthetical", spec.visual.parenthetical);
  applyNodeVars(vars, "transition", spec.visual.transition);
  vars["--sp-scene-ff"] = spec.nodeCompositeFontFamilies.sceneHeading ?? vars["--sp-base-ff"];
  vars["--sp-action-ff"] = spec.nodeCompositeFontFamilies.action ?? vars["--sp-base-ff"];
  vars["--sp-character-ff"] = spec.nodeCompositeFontFamilies.character ?? vars["--sp-base-ff"];
  vars["--sp-dialogue-ff"] = spec.nodeCompositeFontFamilies.dialogue ?? vars["--sp-base-ff"];
  vars["--sp-parenthetical-ff"] = spec.nodeCompositeFontFamilies.parenthetical ?? vars["--sp-base-ff"];
  vars["--sp-transition-ff"] = spec.nodeCompositeFontFamilies.transition ?? vars["--sp-base-ff"];
  vars["--sp-p-ff"] = spec.nodeCompositeFontFamilies.paragraph ?? vars["--sp-base-ff"];

  vars["--sp-layout-mode"] = spec.layoutMode;
  if (spec.dialogueLane) {
    vars["--sp-lane-character-start"] = px(spec.dialogueLane.characterStartInch * PX_PER_INCH);
    vars["--sp-lane-character-end"] = px(spec.dialogueLane.characterEndInch * PX_PER_INCH);
    vars["--sp-lane-speech-start"] = px(spec.dialogueLane.speechStartInch * PX_PER_INCH);
    vars["--sp-lane-speech-end"] = px(spec.dialogueLane.speechEndInch * PX_PER_INCH);
    vars["--sp-lane-character-width"] = px(
      (spec.dialogueLane.characterEndInch - spec.dialogueLane.characterStartInch) * PX_PER_INCH
    );
    vars["--sp-lane-speech-width"] = px(
      (spec.dialogueLane.speechEndInch - spec.dialogueLane.speechStartInch) * PX_PER_INCH
    );
    vars["--sp-lane-row-pl"] = vars["--sp-lane-character-start"];
    vars["--sp-lane-speech-gap"] = px(
      (spec.dialogueLane.speechStartInch - spec.dialogueLane.characterEndInch) * PX_PER_INCH
    );
  }

  return vars as CSSProperties;
}
