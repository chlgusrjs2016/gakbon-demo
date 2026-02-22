import type {
  NodeBreakPolicyMap,
  PageMargins,
  PageRenderConfig,
  PageSizeKey,
  StoredPageRenderSettings,
} from "./types";

export const PX_PER_INCH = 96;

export const PAGE_SIZE_PRESETS: Record<PageSizeKey, { width: number; height: number }> = {
  a4: { width: 794, height: 1123 },
  us_letter: {
    width: Math.round(8.5 * PX_PER_INCH),
    height: Math.round(11 * PX_PER_INCH),
  },
};

export const DEFAULT_PAGE_SIZE: PageSizeKey = "a4";
export const DEFAULT_PAGE_GAP = 12;

export const DEFAULT_PAGE_MARGINS: PageMargins = {
  top: PX_PER_INCH,
  bottom: PX_PER_INCH,
  left: PX_PER_INCH,
  right: PX_PER_INCH,
};

export const DEFAULT_NODE_BREAK_POLICIES: NodeBreakPolicyMap = {
  sceneHeading: "block_only",
  action: "line_split",
  character: "block_only",
  dialogue: "line_split",
  parenthetical: "block_only",
  transition: "block_only",
  paragraph: "line_split",
  unknown: "block_only",
};

export function createPageRenderConfig(args: {
  pageSizeKey: PageSizeKey;
  pageWidth: number;
  pageHeight: number;
  pageGap?: number;
  margins?: Partial<PageMargins>;
  nodeBreakPolicies?: Partial<NodeBreakPolicyMap>;
}): PageRenderConfig {
  return {
    pageSizeKey: args.pageSizeKey,
    pageWidth: args.pageWidth,
    pageHeight: args.pageHeight,
    pageGap: args.pageGap ?? DEFAULT_PAGE_GAP,
    margins: {
      top: args.margins?.top ?? DEFAULT_PAGE_MARGINS.top,
      bottom: args.margins?.bottom ?? DEFAULT_PAGE_MARGINS.bottom,
      left: args.margins?.left ?? DEFAULT_PAGE_MARGINS.left,
      right: args.margins?.right ?? DEFAULT_PAGE_MARGINS.right,
    },
    nodeBreakPolicies: {
      ...DEFAULT_NODE_BREAK_POLICIES,
      ...(args.nodeBreakPolicies ?? {}),
    },
  };
}

export function resolvePageRenderConfig(
  pageSizeKey: PageSizeKey,
  settings?: StoredPageRenderSettings | null
): PageRenderConfig {
  const resolvedPageSize = settings?.screenplay_page_size ?? pageSizeKey;
  const page = PAGE_SIZE_PRESETS[resolvedPageSize] ?? PAGE_SIZE_PRESETS[DEFAULT_PAGE_SIZE];
  const incomingMargins = settings?.screenplay_margins ?? null;
  const incomingPolicies = settings?.node_break_policies ?? null;

  return createPageRenderConfig({
    pageSizeKey: resolvedPageSize,
    pageWidth: page.width,
    pageHeight: page.height,
    pageGap: DEFAULT_PAGE_GAP,
    margins: incomingMargins ?? undefined,
    nodeBreakPolicies: incomingPolicies ?? undefined,
  });
}
