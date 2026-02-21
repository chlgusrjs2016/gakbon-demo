import type {
  BlockMeasurement,
  BreakMarker,
  BreakPolicy,
  PageMetrics,
  PageRenderConfig,
} from "./types";

type BreakComputation = {
  pageCount: number;
  breakMarkers: BreakMarker[];
};

function contentHeightPerPage(config: PageRenderConfig) {
  return config.pageHeight - config.margins.top - config.margins.bottom;
}

function resolvePolicy(config: PageRenderConfig, nodeType: BlockMeasurement["nodeType"]): BreakPolicy {
  return config.nodeBreakPolicies[nodeType] ?? config.nodeBreakPolicies.unknown ?? "block_only";
}

export function computeBreakMarkers(
  blocks: BlockMeasurement[],
  config: PageRenderConfig
): BreakComputation {
  const breakMarkers: BreakMarker[] = [];
  const contentHeight = contentHeightPerPage(config);

  if (blocks.length === 0) {
    return { pageCount: 1, breakMarkers };
  }

  let pageCount = 1;
  let pageContentEnd = contentHeight;
  let cumulativeShift = 0;

  for (const block of blocks) {
    const shiftedTop = block.top + cumulativeShift;
    const shiftedBottom = block.bottom + cumulativeShift;
    const policy = resolvePolicy(config, block.nodeType);

    if (block.height > contentHeight || policy === "never_split") {
      continue;
    }

    if (shiftedBottom > pageContentEnd) {
      const spaceToEnd = pageContentEnd - shiftedTop;
      const spacerHeight = spaceToEnd + config.margins.bottom + config.pageGap + config.margins.top;

      breakMarkers.push({
        blockIndex: block.index,
        spacerHeight,
        reason: policy === "line_split" ? "line_split_fallback" : "overflow",
        policy,
        nodeType: block.nodeType,
      });

      cumulativeShift += spacerHeight;
      pageCount += 1;
      pageContentEnd += contentHeight + config.margins.top + config.margins.bottom + config.pageGap;
    }
  }

  return { pageCount, breakMarkers };
}

export function buildPageMetrics(
  blocks: BlockMeasurement[],
  config: PageRenderConfig,
  breakComputation: BreakComputation
): PageMetrics {
  const { pageCount, breakMarkers } = breakComputation;
  const canvasHeight = pageCount * config.pageHeight + Math.max(0, pageCount - 1) * config.pageGap;
  const first = blocks[0];
  const firstNonEmpty = blocks.find((b) => b.text.length > 0);

  return {
    pageCount,
    canvasHeight,
    breakMarkers,
    firstLineTop: first?.top ?? null,
    firstNonEmptyTop: firstNonEmpty?.top ?? null,
  };
}
