import type { ResolvedScreenplaySpec, ScreenplayNodeVisualSpec } from "./types";

function normalizeSpacingScale(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 1;
  return Math.floor(value * 100) / 100;
}

function scaledLength(value: string, scale: number) {
  return scale === 1 ? value : `calc(${value} * ${scale})`;
}

function scaledLineHeight(value: number, scale: number) {
  return scale === 1 ? String(value) : `calc(${value} * ${scale})`;
}

function nodeCss(selector: string, spec: ScreenplayNodeVisualSpec, spacingScale: number) {
  const lines = [
    `${selector} {`,
    `  margin-top: ${scaledLength(spec.marginTop, spacingScale)};`,
    `  margin-bottom: ${scaledLength(spec.marginBottom, spacingScale)};`,
    `  padding-left: ${spec.paddingLeft}px;`,
    `  padding-right: ${spec.paddingRight}px;`,
  ];
  if (spec.fontFamily) lines.push(`  font-family: ${spec.fontFamily};`);
  if (typeof spec.fontSize === "number") lines.push(`  font-size: ${spec.fontSize}px;`);
  if (typeof spec.lineHeight === "number") lines.push(`  line-height: ${scaledLineHeight(spec.lineHeight, spacingScale)};`);
  if (typeof spec.letterSpacing === "number") lines.push(`  letter-spacing: ${spec.letterSpacing}px;`);
  if (spec.color) lines.push(`  color: ${spec.color};`);
  if (spec.textTransform) lines.push(`  text-transform: ${spec.textTransform};`);
  if (spec.textAlign) lines.push(`  text-align: ${spec.textAlign};`);
  if (typeof spec.fontWeight === "number") lines.push(`  font-weight: ${spec.fontWeight};`);
  if (spec.fontStyle) lines.push(`  font-style: ${spec.fontStyle};`);
  lines.push("}");
  return lines.join("\n");
}

export function buildScreenplayPdfCssFromSpec(spec: ResolvedScreenplaySpec) {
  const base = spec.visual.base;
  const lane = spec.dialogueLane;
  const spacingScale = normalizeSpacingScale(base.spacingScale);
  const runtimeDialogueBlockCss =
    lane
      ? spec.layoutMode === "kr_dialogue_inline"
        ? `
.screenplay-root .dialogue-block {
  margin-top: ${scaledLength("1em", spacingScale)};
  margin-bottom: 0;
}
.screenplay-root .dialogue-block > .dialogue-block__content {
  display: grid;
  grid-template-columns: ${(lane.characterEndInch - lane.characterStartInch) * 96}px minmax(0, ${(lane.speechEndInch - lane.speechStartInch) * 96}px);
  column-gap: ${(lane.speechStartInch - lane.characterEndInch) * 96}px;
  padding-left: ${lane.characterStartInch * 96}px;
  align-items: start;
}
.screenplay-root .dialogue-block > .dialogue-block__content > .character {
  grid-column: 1;
  margin: 0 !important;
  padding: 0 !important;
  width: ${(lane.characterEndInch - lane.characterStartInch) * 96}px;
}
.screenplay-root .dialogue-block > .dialogue-block__content > .speech-flow {
  grid-column: 2;
  margin: 0 !important;
  padding: 0 !important;
  width: ${(lane.speechEndInch - lane.speechStartInch) * 96}px;
}
.screenplay-root .dialogue-block .speech-flow__content {
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
}
.screenplay-root .dialogue-block .speech-flow__content > .dialogue,
.screenplay-root .dialogue-block .speech-flow__content > .parenthetical {
  display: inline !important;
  margin: 0 !important;
  padding: 0 !important;
}
.screenplay-root .dialogue-block .speech-flow__content > .dialogue + .parenthetical,
.screenplay-root .dialogue-block .speech-flow__content > .parenthetical + .dialogue,
.screenplay-root .dialogue-block .speech-flow__content > .parenthetical + .parenthetical {
  margin-left: 0.5em !important;
}
.screenplay-root .dialogue-block .speech-flow__content > .dialogue + .dialogue {
  margin-left: 0 !important;
}
.screenplay-root .dialogue-block .speech-flow__content > .dialogue + .dialogue::before {
  content: "\\A";
  white-space: pre;
}
`
        : `
.screenplay-root .dialogue-block {
  display: block;
}
.screenplay-root .dialogue-block > .dialogue-block__content {
  display: block;
}
.screenplay-root .dialogue-block > .dialogue-block__content > .character {
  margin-top: ${scaledLength(spec.visual.character.marginTop, spacingScale)};
  margin-bottom: ${scaledLength(spec.visual.character.marginBottom, spacingScale)};
  padding-left: ${spec.visual.character.paddingLeft}px;
  padding-right: ${spec.visual.character.paddingRight}px;
}
.screenplay-root .dialogue-block .speech-flow__content > .parenthetical,
.screenplay-root .dialogue-block .speech-flow__content > .dialogue {
  display: block;
}
`
      : "";
  return `
.screenplay-root {
  font-family: ${base.fontFamily};
  color: ${base.color};
  font-size: ${base.fontSize}px;
  line-height: ${scaledLineHeight(base.lineHeight, spacingScale)};
  letter-spacing: ${base.letterSpacing}px;
  counter-reset: scene-counter;
}
${nodeCss(".screenplay-root p", spec.visual.paragraph, spacingScale)}
.screenplay-root .scene-heading {
  position: relative;
  counter-increment: scene-counter;
}
${nodeCss(".screenplay-root .scene-heading", spec.visual.sceneHeading, spacingScale)}
.screenplay-root .scene-heading::before {
  content: ${spec.layoutMode === "kr_dialogue_inline" ? '"#" counter(scene-counter) "."' : 'counter(scene-counter) "."'};
  position: absolute;
  left: 96px;
}
${nodeCss(".screenplay-root .action", spec.visual.action, spacingScale)}
${nodeCss(".screenplay-root .character", spec.visual.character, spacingScale)}
${nodeCss(".screenplay-root .dialogue", spec.visual.dialogue, spacingScale)}
${nodeCss(".screenplay-root .parenthetical", spec.visual.parenthetical, spacingScale)}
${nodeCss(".screenplay-root .transition-block", spec.visual.transition, spacingScale)}
.screenplay-root strong,
.screenplay-root b { font-weight: 400 !important; }
.screenplay-root em,
.screenplay-root i { font-style: normal !important; }
${runtimeDialogueBlockCss}
`;
}
