import type { ResolvedScreenplaySpec, ScreenplayNodeVisualSpec } from "./types";

function nodeCss(selector: string, spec: ScreenplayNodeVisualSpec) {
  const lines = [
    `${selector} {`,
    `  margin-top: ${spec.marginTop};`,
    `  margin-bottom: ${spec.marginBottom};`,
    `  padding-left: ${spec.paddingLeft}px;`,
    `  padding-right: ${spec.paddingRight}px;`,
  ];
  if (spec.fontFamily) lines.push(`  font-family: ${spec.fontFamily};`);
  if (typeof spec.fontSize === "number") lines.push(`  font-size: ${spec.fontSize}px;`);
  if (typeof spec.lineHeight === "number") lines.push(`  line-height: ${spec.lineHeight};`);
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
  const runtimeDialogueBlockCss =
    lane
      ? spec.layoutMode === "kr_dialogue_inline"
        ? `
.screenplay-root .dialogue-block {
  margin-top: 1em;
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
  margin-top: ${spec.visual.character.marginTop};
  margin-bottom: ${spec.visual.character.marginBottom};
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
  line-height: ${base.lineHeight};
  letter-spacing: ${base.letterSpacing}px;
  counter-reset: scene-counter;
}
${nodeCss(".screenplay-root p", spec.visual.paragraph)}
.screenplay-root .scene-heading {
  position: relative;
  counter-increment: scene-counter;
}
${nodeCss(".screenplay-root .scene-heading", spec.visual.sceneHeading)}
.screenplay-root .scene-heading::before {
  content: ${spec.layoutMode === "kr_dialogue_inline" ? '"#" counter(scene-counter) "."' : 'counter(scene-counter) "."'};
  position: absolute;
  left: 96px;
}
${nodeCss(".screenplay-root .action", spec.visual.action)}
${nodeCss(".screenplay-root .character", spec.visual.character)}
${nodeCss(".screenplay-root .dialogue", spec.visual.dialogue)}
${nodeCss(".screenplay-root .parenthetical", spec.visual.parenthetical)}
${nodeCss(".screenplay-root .transition-block", spec.visual.transition)}
.screenplay-root strong,
.screenplay-root b { font-weight: 400 !important; }
.screenplay-root em,
.screenplay-root i { font-style: normal !important; }
${runtimeDialogueBlockCss}
`;
}
