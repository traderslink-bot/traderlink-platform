import type {
  TradeAnalysisDebugDashboard,
  TradeAnalysisDebugDashboardItem,
} from "./trade-analysis-debug-dashboard";

export interface TradeAnalysisDebugDashboardComparisonItem {
  requestIndex: number;
  symbol: string | null;
  changeType: "added" | "removed" | "changed" | "unchanged";
  changedFields: string[];
  left: TradeAnalysisDebugDashboardItem | null;
  right: TradeAnalysisDebugDashboardItem | null;
}

export interface TradeAnalysisDebugDashboardComparison {
  contractVersion: "trade_analysis_debug_dashboard_comparison_v1";
  generatedAt: string;
  left: {
    source: string;
    generatedAt: string;
    requestCount: number;
    completedCount: number;
    failedCount: number;
  };
  right: {
    source: string;
    generatedAt: string;
    requestCount: number;
    completedCount: number;
    failedCount: number;
  };
  totalsDelta: {
    requestCount: number;
    completedCount: number;
    failedCount: number;
  };
  itemCounts: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  items: TradeAnalysisDebugDashboardComparisonItem[];
}

function summarizeDashboard(dashboard: TradeAnalysisDebugDashboard) {
  return {
    source: dashboard.source,
    generatedAt: dashboard.generatedAt,
    requestCount: dashboard.requestCount,
    completedCount: dashboard.completedCount,
    failedCount: dashboard.failedCount,
  };
}

function itemByIndex(
  dashboard: TradeAnalysisDebugDashboard,
): Map<number, TradeAnalysisDebugDashboardItem> {
  return new Map(
    dashboard.items.map((item) => [item.requestIndex, item] as const),
  );
}

function topAnchorPatternId(
  item: TradeAnalysisDebugDashboardItem | null,
): string | null {
  return item?.summary?.patterns.topAnchorPattern?.patternId ?? null;
}

function detectedPatternCount(
  item: TradeAnalysisDebugDashboardItem | null,
): number | null {
  return item?.summary?.patterns.detectedCount ?? null;
}

function normalizedPatternCount(
  item: TradeAnalysisDebugDashboardItem | null,
): number | null {
  return item?.summary?.patterns.normalizedCount ?? null;
}

function supportResistanceCounts(
  item: TradeAnalysisDebugDashboardItem | null,
): string | null {
  const supportResistance = item?.summary?.supportResistance;

  if (!supportResistance) {
    return null;
  }

  return `${supportResistance.supportCount}/${supportResistance.resistanceCount}`;
}

function marketStructureFingerprint(
  item: TradeAnalysisDebugDashboardItem | null,
): string | null {
  const marketStructure = item?.summary?.marketStructure;

  if (!marketStructure) {
    return null;
  }

  return [
    marketStructure.observed,
    marketStructure.state,
    marketStructure.trendDirection,
    marketStructure.confidenceLabel,
    marketStructure.usedForScoring,
    marketStructure.diagnosticCodes.join(","),
  ].join("|");
}

function getChangedFields(args: {
  left: TradeAnalysisDebugDashboardItem;
  right: TradeAnalysisDebugDashboardItem;
}): string[] {
  const changedFields: string[] = [];

  if (args.left.status !== args.right.status) {
    changedFields.push("status");
  }

  if (args.left.failure?.code !== args.right.failure?.code) {
    changedFields.push("failure.code");
  }

  if (
    supportResistanceCounts(args.left) !== supportResistanceCounts(args.right)
  ) {
    changedFields.push("supportResistance.counts");
  }

  if (
    marketStructureFingerprint(args.left) !==
    marketStructureFingerprint(args.right)
  ) {
    changedFields.push("marketStructure");
  }

  if (detectedPatternCount(args.left) !== detectedPatternCount(args.right)) {
    changedFields.push("patterns.detectedCount");
  }

  if (normalizedPatternCount(args.left) !== normalizedPatternCount(args.right)) {
    changedFields.push("patterns.normalizedCount");
  }

  if (topAnchorPatternId(args.left) !== topAnchorPatternId(args.right)) {
    changedFields.push("patterns.topAnchorPattern");
  }

  return changedFields;
}

function compareItem(args: {
  requestIndex: number;
  left: TradeAnalysisDebugDashboardItem | undefined;
  right: TradeAnalysisDebugDashboardItem | undefined;
}): TradeAnalysisDebugDashboardComparisonItem {
  if (!args.left && args.right) {
    return {
      requestIndex: args.requestIndex,
      symbol: args.right.symbol,
      changeType: "added",
      changedFields: ["item"],
      left: null,
      right: args.right,
    };
  }

  if (args.left && !args.right) {
    return {
      requestIndex: args.requestIndex,
      symbol: args.left.symbol,
      changeType: "removed",
      changedFields: ["item"],
      left: args.left,
      right: null,
    };
  }

  if (!args.left || !args.right) {
    throw new Error("Unexpected missing comparison item.");
  }

  const changedFields = getChangedFields({
    left: args.left,
    right: args.right,
  });

  return {
    requestIndex: args.requestIndex,
    symbol: args.right.symbol ?? args.left.symbol,
    changeType: changedFields.length > 0 ? "changed" : "unchanged",
    changedFields,
    left: args.left,
    right: args.right,
  };
}

function countByChangeType(
  items: TradeAnalysisDebugDashboardComparisonItem[],
  changeType: TradeAnalysisDebugDashboardComparisonItem["changeType"],
): number {
  return items.filter((item) => item.changeType === changeType).length;
}

export function compareTradeAnalysisDebugDashboards(args: {
  left: TradeAnalysisDebugDashboard;
  right: TradeAnalysisDebugDashboard;
  generatedAt?: string;
}): TradeAnalysisDebugDashboardComparison {
  const leftByIndex = itemByIndex(args.left);
  const rightByIndex = itemByIndex(args.right);
  const indexes = [...new Set([...leftByIndex.keys(), ...rightByIndex.keys()])].sort(
    (left, right) => left - right,
  );
  const items = indexes.map((requestIndex) =>
    compareItem({
      requestIndex,
      left: leftByIndex.get(requestIndex),
      right: rightByIndex.get(requestIndex),
    }),
  );

  return {
    contractVersion: "trade_analysis_debug_dashboard_comparison_v1",
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    left: summarizeDashboard(args.left),
    right: summarizeDashboard(args.right),
    totalsDelta: {
      requestCount: args.right.requestCount - args.left.requestCount,
      completedCount: args.right.completedCount - args.left.completedCount,
      failedCount: args.right.failedCount - args.left.failedCount,
    },
    itemCounts: {
      added: countByChangeType(items, "added"),
      removed: countByChangeType(items, "removed"),
      changed: countByChangeType(items, "changed"),
      unchanged: countByChangeType(items, "unchanged"),
    },
    items,
  };
}

function formatDelta(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function formatItem(
  item: TradeAnalysisDebugDashboardComparisonItem,
): string[] {
  if (item.changeType === "unchanged") {
    return [];
  }

  return [
    `## Request ${item.requestIndex}: ${item.symbol ?? "unknown"}`,
    "",
    `- change: ${item.changeType}`,
    `- fields: ${
      item.changedFields.length > 0 ? item.changedFields.join(", ") : "none"
    }`,
    `- left status: ${item.left?.status ?? "missing"}`,
    `- right status: ${item.right?.status ?? "missing"}`,
    `- left top anchor: ${topAnchorPatternId(item.left) ?? "none"}`,
    `- right top anchor: ${topAnchorPatternId(item.right) ?? "none"}`,
    "",
  ];
}

export function formatTradeAnalysisDebugDashboardComparisonMarkdown(
  comparison: TradeAnalysisDebugDashboardComparison,
): string {
  const itemLines = comparison.items.flatMap(formatItem);

  return [
    "# Trade Analysis Debug Dashboard Comparison",
    "",
    "## Runs",
    "",
    `- left: ${comparison.left.source} (${comparison.left.generatedAt})`,
    `- right: ${comparison.right.source} (${comparison.right.generatedAt})`,
    "",
    "## Totals Delta",
    "",
    `- requests: ${formatDelta(comparison.totalsDelta.requestCount)}`,
    `- completed: ${formatDelta(comparison.totalsDelta.completedCount)}`,
    `- failed: ${formatDelta(comparison.totalsDelta.failedCount)}`,
    "",
    "## Item Changes",
    "",
    `- added: ${comparison.itemCounts.added}`,
    `- removed: ${comparison.itemCounts.removed}`,
    `- changed: ${comparison.itemCounts.changed}`,
    `- unchanged: ${comparison.itemCounts.unchanged}`,
    "",
    ...(itemLines.length > 0 ? itemLines : ["No item-level changes.", ""]),
  ].join("\n");
}
