export type PageSizeKey = "a4" | "us_letter";

export type PageMargins = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type BreakPolicy = "block_only" | "line_split" | "never_split";

export type NodeTypeKey =
  | "sceneHeading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition"
  | "paragraph"
  | "unknown";

export type NodeBreakPolicyMap = Record<NodeTypeKey, BreakPolicy>;

export type PageRenderConfig = {
  pageSizeKey: PageSizeKey;
  pageWidth: number;
  pageHeight: number;
  pageGap: number;
  margins: PageMargins;
  nodeBreakPolicies: NodeBreakPolicyMap;
};

export type BlockMeasurement = {
  index: number;
  nodeType: NodeTypeKey;
  text: string;
  top: number;
  height: number;
  bottom: number;
  marginTop: number;
};

export type BreakMarker = {
  blockIndex: number;
  spacerHeight: number;
  reason: "overflow" | "line_split_fallback";
  policy: BreakPolicy;
  nodeType: NodeTypeKey;
};

export type PageMetrics = {
  pageCount: number;
  canvasHeight: number;
  breakMarkers: BreakMarker[];
  firstLineTop: number | null;
  firstNonEmptyTop: number | null;
};

export type StoredPageRenderSettings = {
  screenplay_page_size?: PageSizeKey;
  screenplay_margins?: Partial<PageMargins> | null;
  node_break_policies?: Partial<NodeBreakPolicyMap> | null;
};
