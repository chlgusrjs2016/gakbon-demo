export type ScreenplayDomGroup = {
  startIndex: number;
  endIndex: number;
  elements: HTMLElement[];
};

function resolveSemanticRoot(el: HTMLElement): HTMLElement {
  const directSemantic = el.querySelector(
    ":scope > [data-type], :scope > .node-dialogueBlock, :scope > .scene-heading, :scope > .action, :scope > .character, :scope > .dialogue, :scope > .parenthetical, :scope > .transition-block, :scope > p",
  ) as HTMLElement | null;
  return directSemantic ?? el;
}

function elType(el: HTMLElement): string {
  const root = resolveSemanticRoot(el);
  const dataType = root.getAttribute("data-type");
  if (dataType) return dataType;
  if (root.classList.contains("node-dialogueBlock")) return "dialogue-block";
  if (root.classList.contains("scene-heading")) return "sceneHeading";
  if (root.classList.contains("action")) return "action";
  if (root.classList.contains("character")) return "character";
  if (root.classList.contains("dialogue")) return "dialogue";
  if (root.classList.contains("parenthetical")) return "parenthetical";
  if (root.classList.contains("transition-block")) return "transition";
  if (root.tagName === "P") return "paragraph";
  return "unknown";
}

export function buildScreenplayDomGroups(children: HTMLElement[]): ScreenplayDomGroup[] {
  const groups: ScreenplayDomGroup[] = [];
  let i = 0;
  while (i < children.length) {
    const first = children[i];
    const type = elType(first);
    if (type !== "character") {
      groups.push({ startIndex: i, endIndex: i, elements: [first] });
      i += 1;
      continue;
    }

    const els = [first];
    let j = i + 1;
    while (j < children.length) {
      const nextType = elType(children[j]);
      if (nextType === "dialogue" || nextType === "parenthetical") {
        els.push(children[j]);
        j += 1;
        continue;
      }
      break;
    }
    groups.push({ startIndex: i, endIndex: j - 1, elements: els });
    i = j;
  }
  return groups;
}
