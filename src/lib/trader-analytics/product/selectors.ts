import type { ExecutionFeedbackPoint } from "../../execution-feedback/types/execution-feedback-point";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import type {
  BehaviorTrendCard,
  FilteredTraderAnalyticsView,
  ProductTraderAnalyticsTradeRow,
  SavedExecutionTrade,
  SavedTradeReviewViewModel,
  SavedTraderAnalyticsReport,
  TraderAnalyticsComparison,
  TraderAnalyticsDrillDown,
  TraderAnalyticsFilter,
  TraderAnalyticsFilterOptions,
  TraderAnalyticsMetricDelta,
  TraderFocusQueueItem,
} from "./types";
import { buildTradeJournalPrompts } from "./product-expansion";

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

function rowEntryHour(row: { entryHourEt?: number | null }): number | null {
  return typeof row.entryHourEt === "number" && Number.isFinite(row.entryHourEt)
    ? row.entryHourEt
    : null;
}

function rowEntryHourLabel(row: {
  entryHourEt?: number | null;
  entryHourLabelEt?: string;
}): string {
  const hour = rowEntryHour(row);

  return (
    row.entryHourLabelEt ??
    (hour === null ? "n/a" : `${String(hour).padStart(2, "0")}:00 ET`)
  );
}

function tradeRowsWithIds(
  savedReport: SavedTraderAnalyticsReport,
): ProductTraderAnalyticsTradeRow[] {
  return savedReport.report.trades.map((row) => ({
    ...row,
    tradeId:
      savedReport.sourceSummaries.find(
        (summaryRef) => summaryRef.requestIndex === row.requestIndex,
      )?.tradeId ??
      savedReport.sourceTradeIds[row.tradeIndex - 1] ??
      `trade-${row.tradeIndex}`,
  }));
}

function pointDigest(point: ExecutionFeedbackPoint) {
  return {
    id: point.id,
    kind: point.kind,
    category: point.category,
    label: point.label,
    summary: point.summary,
    severity: point.severity,
    confidence: point.confidence,
    priorityScore: point.priorityScore,
  };
}

export function getLatestSavedTraderAnalyticsReport(
  reports: SavedTraderAnalyticsReport[],
): SavedTraderAnalyticsReport | null {
  return (
    [...reports].sort((left, right) =>
      right.generatedAt.localeCompare(left.generatedAt),
    )[0] ?? null
  );
}

export function buildTraderAnalyticsFilterOptions(
  report: SavedTraderAnalyticsReport,
): TraderAnalyticsFilterOptions {
  const rows = tradeRowsWithIds(report);
  const outcomes = new Set<"winner" | "loser" | "flat">();
  const lifecycles = new Set<"closed" | "open">();

  for (const row of rows) {
    outcomes.add(
      row.grossRealizedPnl > 0
        ? "winner"
        : row.grossRealizedPnl < 0
          ? "loser"
          : "flat",
    );
    lifecycles.add(row.isOpenPosition ? "open" : "closed");
  }

  return {
    symbols: uniqueSorted(rows.map((row) => row.symbol)),
    tradeDirections: uniqueSorted(rows.map((row) => row.tradeDirection)),
    sessionBuckets: uniqueSorted(rows.map((row) => row.sessionBucket)),
    entryHoursEt: [...new Map(
      rows
        .filter((row) => rowEntryHour(row) !== null)
        .map((row) => [
          rowEntryHour(row) as number,
          {
            value: rowEntryHour(row) as number,
            label: rowEntryHourLabel(row),
          },
        ]),
    ).values()].sort((left, right) => left.value - right.value),
    outcomes: [...outcomes],
    lifecycles: [...lifecycles],
  };
}

export function buildFilteredTraderAnalyticsView(args: {
  report: SavedTraderAnalyticsReport;
  filters?: TraderAnalyticsFilter;
}): FilteredTraderAnalyticsView {
  const filters = args.filters ?? {};
  const rows = tradeRowsWithIds(args.report);
  const filteredRows = rows.filter((row) => {
    if (filters.symbol && row.symbol !== filters.symbol) {
      return false;
    }

    if (
      filters.tradeDirection &&
      row.tradeDirection !== filters.tradeDirection
    ) {
      return false;
    }

    if (filters.sessionBucket && row.sessionBucket !== filters.sessionBucket) {
      return false;
    }

    if (
      filters.entryHourEt !== undefined &&
      rowEntryHour(row) !== filters.entryHourEt
    ) {
      return false;
    }

    if (filters.outcome) {
      const outcome =
        row.grossRealizedPnl > 0
          ? "winner"
          : row.grossRealizedPnl < 0
            ? "loser"
            : "flat";

      if (outcome !== filters.outcome) {
        return false;
      }
    }

    if (filters.lifecycle) {
      const lifecycle = row.isOpenPosition ? "open" : "closed";

      if (lifecycle !== filters.lifecycle) {
        return false;
      }
    }

    return true;
  });

  return {
    sourceReportId: args.report.id,
    totalTradeCount: rows.length,
    filteredTradeCount: filteredRows.length,
    filters,
    rows: filteredRows,
  };
}

function sourceRowsForSummaryRefs(args: {
  savedReport: SavedTraderAnalyticsReport;
  predicate: (summary: ExecutionFeedbackSummary) => boolean;
}): ProductTraderAnalyticsTradeRow[] {
  const rows = tradeRowsWithIds(args.savedReport);
  const rowsByRequestIndex = new Map(rows.map((row) => [row.requestIndex, row]));

  return args.savedReport.sourceSummaries
    .filter((summaryRef) => args.predicate(summaryRef.summary))
    .map((summaryRef) => rowsByRequestIndex.get(summaryRef.requestIndex))
    .filter((row): row is ProductTraderAnalyticsTradeRow => row !== undefined);
}

function uniqueRows(
  rows: ProductTraderAnalyticsTradeRow[],
): ProductTraderAnalyticsTradeRow[] {
  const seen = new Set<string>();
  const result: ProductTraderAnalyticsTradeRow[] = [];

  for (const row of rows) {
    if (seen.has(row.tradeId)) {
      continue;
    }

    seen.add(row.tradeId);
    result.push(row);
  }

  return result;
}

export function buildTraderAnalyticsDrillDowns(
  savedReport: SavedTraderAnalyticsReport,
): TraderAnalyticsDrillDown[] {
  const drillDowns: TraderAnalyticsDrillDown[] = [];

  for (const point of savedReport.report.topRisks) {
    const rows = uniqueRows(
      sourceRowsForSummaryRefs({
        savedReport,
        predicate: (summary) =>
          summary.points.risks.some((risk) => risk.id === point.id),
      }),
    );

    drillDowns.push({
      id: `risk:${point.id}`,
      kind: "risk",
      label: point.label,
      summary: point.summary,
      sourceMetricId: point.id,
      category: point.category,
      tradeIds: rows.map((row) => row.tradeId),
      rows,
    });
  }

  for (const point of savedReport.report.topStrengths) {
    const rows = uniqueRows(
      sourceRowsForSummaryRefs({
        savedReport,
        predicate: (summary) =>
          summary.points.strengths.some((strength) => strength.id === point.id),
      }),
    );

    drillDowns.push({
      id: `strength:${point.id}`,
      kind: "strength",
      label: point.label,
      summary: point.summary,
      sourceMetricId: point.id,
      category: point.category,
      tradeIds: rows.map((row) => row.tradeId),
      rows,
    });
  }

  for (const point of savedReport.report.primaryFocusCounts) {
    const rows = uniqueRows(
      sourceRowsForSummaryRefs({
        savedReport,
        predicate: (summary) => summary.points.primaryFocus?.id === point.id,
      }),
    );

    drillDowns.push({
      id: `primary:${point.id}`,
      kind: "primary_focus",
      label: point.label,
      summary: point.summary,
      sourceMetricId: point.id,
      category: point.category,
      tradeIds: rows.map((row) => row.tradeId),
      rows,
    });
  }

  const allRows = tradeRowsWithIds(savedReport);
  const lifecycleRows = allRows.filter((row) => row.isOpenPosition);
  const loserRows = allRows.filter((row) => row.grossRealizedPnl < 0);
  const winnerRows = allRows.filter((row) => row.grossRealizedPnl > 0);

  drillDowns.push(
    {
      id: "lifecycle:open_position",
      kind: "lifecycle",
      label: "Open Position Leftovers",
      summary: "Trades that still had open shares at the end of the execution sequence.",
      sourceMetricId: "open_position_leftover",
      category: "lifecycle",
      tradeIds: lifecycleRows.map((row) => row.tradeId),
      rows: lifecycleRows,
    },
    {
      id: "pnl:gross_losers",
      kind: "pnl",
      label: "Gross Losing Trades",
      summary: "Trades with negative gross execution-only realized P/L.",
      sourceMetricId: "gross_losers",
      category: "pnl",
      tradeIds: loserRows.map((row) => row.tradeId),
      rows: loserRows,
    },
    {
      id: "pnl:gross_winners",
      kind: "pnl",
      label: "Gross Winning Trades",
      summary: "Trades with positive gross execution-only realized P/L.",
      sourceMetricId: "gross_winners",
      category: "pnl",
      tradeIds: winnerRows.map((row) => row.tradeId),
      rows: winnerRows,
    },
  );

  return drillDowns.filter((drillDown) => drillDown.rows.length > 0);
}

function metricDelta(args: {
  id: string;
  label: string;
  previousValue: number | null;
  currentValue: number | null;
  favorableDirection: "up" | "down" | "neutral";
}): TraderAnalyticsMetricDelta {
  const delta =
    args.previousValue === null || args.currentValue === null
      ? null
      : roundMetric(args.currentValue - args.previousValue);

  return {
    ...args,
    delta,
    direction:
      delta === null
        ? "insufficient_data"
        : delta > 0
          ? "up"
          : delta < 0
            ? "down"
            : "flat",
  };
}

function trendCard(args: {
  behaviorId: string;
  label: string;
  previousRate: number | null;
  currentRate: number | null;
  favorableDirection: "up" | "down";
  sampleSizeWarning: boolean;
}): BehaviorTrendCard {
  const delta =
    args.previousRate === null || args.currentRate === null
      ? null
      : roundMetric(args.currentRate - args.previousRate);
  const rawDirection =
    delta === null
      ? "insufficient_data"
      : Math.abs(delta) < 0.000001
        ? "flat"
        : (delta > 0 ? "up" : "down");
  const direction =
    rawDirection === "insufficient_data" || rawDirection === "flat"
      ? rawDirection
      : rawDirection === args.favorableDirection
        ? "improving"
        : "worsening";

  return {
    behaviorId: args.behaviorId,
    label: args.label,
    previousRate: args.previousRate,
    currentRate: args.currentRate,
    delta,
    direction,
    sampleSizeWarning: args.sampleSizeWarning,
    copy:
      direction === "improving"
        ? `${args.label} appeared less often in the newer sample.`
        : direction === "worsening"
          ? `${args.label} appeared more often in the newer sample.`
          : direction === "flat"
            ? `${args.label} was unchanged across the compared samples.`
            : `More reviewed trades are needed before comparing ${args.label}.`,
  };
}

export function buildBehaviorTrendCards(args: {
  previousReport: SavedTraderAnalyticsReport;
  currentReport: SavedTraderAnalyticsReport;
}): BehaviorTrendCard[] {
  const sampleSizeWarning =
    args.previousReport.report.sampleSize.completedTradeCount < 5 ||
    args.currentReport.report.sampleSize.completedTradeCount < 5;

  return [
    trendCard({
      behaviorId: "adverse_price_adds",
      label: "Adverse Adds",
      previousRate: args.previousReport.report.executionBehavior.adversePriceAddRate,
      currentRate: args.currentReport.report.executionBehavior.adversePriceAddRate,
      favorableDirection: "down",
      sampleSizeWarning,
    }),
    trendCard({
      behaviorId: "open_position_leftover",
      label: "Open Position Leftovers",
      previousRate: args.previousReport.report.lifecycle.openPositionRate,
      currentRate: args.currentReport.report.lifecycle.openPositionRate,
      favorableDirection: "down",
      sampleSizeWarning,
    }),
    trendCard({
      behaviorId: "rapid_fire_execution_cluster",
      label: "Rapid-Fire Clusters",
      previousRate:
        args.previousReport.report.sampleSize.completedTradeCount > 0
          ? args.previousReport.report.executionBehavior.rapidFireExecutionTradeCount /
            args.previousReport.report.sampleSize.completedTradeCount
          : null,
      currentRate:
        args.currentReport.report.sampleSize.completedTradeCount > 0
          ? args.currentReport.report.executionBehavior.rapidFireExecutionTradeCount /
            args.currentReport.report.sampleSize.completedTradeCount
          : null,
      favorableDirection: "down",
      sampleSizeWarning,
    }),
    trendCard({
      behaviorId: "decisive_full_exit",
      label: "Decisive Full Exits",
      previousRate:
        args.previousReport.report.sampleSize.completedTradeCount > 0
          ? args.previousReport.report.strengths.decisiveFullExitCount /
            args.previousReport.report.sampleSize.completedTradeCount
          : null,
      currentRate:
        args.currentReport.report.sampleSize.completedTradeCount > 0
          ? args.currentReport.report.strengths.decisiveFullExitCount /
            args.currentReport.report.sampleSize.completedTradeCount
          : null,
      favorableDirection: "up",
      sampleSizeWarning,
    }),
  ];
}

export function buildTraderAnalyticsComparison(args: {
  previousReport: SavedTraderAnalyticsReport;
  currentReport: SavedTraderAnalyticsReport;
}): TraderAnalyticsComparison {
  const behaviorDeltas = buildBehaviorTrendCards(args);

  return {
    id: `${args.previousReport.id}_vs_${args.currentReport.id}`,
    label: `${args.currentReport.reportPeriod.label} vs ${args.previousReport.reportPeriod.label}`,
    leftReportId: args.previousReport.id,
    rightReportId: args.currentReport.id,
    leftLabel: args.previousReport.reportPeriod.label,
    rightLabel: args.currentReport.reportPeriod.label,
    sampleSizeWarning:
      args.previousReport.report.sampleSize.completedTradeCount < 5 ||
      args.currentReport.report.sampleSize.completedTradeCount < 5,
    metricDeltas: [
      metricDelta({
        id: "gross_total_realized_pnl",
        label: "Total Gross P/L",
        previousValue: args.previousReport.report.pnl.grossTotalRealizedPnl,
        currentValue: args.currentReport.report.pnl.grossTotalRealizedPnl,
        favorableDirection: "up",
      }),
      metricDelta({
        id: "gross_win_rate",
        label: "Gross Win Rate",
        previousValue: args.previousReport.report.pnl.grossWinRate,
        currentValue: args.currentReport.report.pnl.grossWinRate,
        favorableDirection: "up",
      }),
      metricDelta({
        id: "adverse_add_rate",
        label: "Adverse Add Rate",
        previousValue:
          args.previousReport.report.executionBehavior.adversePriceAddRate,
        currentValue:
          args.currentReport.report.executionBehavior.adversePriceAddRate,
        favorableDirection: "down",
      }),
      metricDelta({
        id: "open_position_rate",
        label: "Open Position Rate",
        previousValue: args.previousReport.report.lifecycle.openPositionRate,
        currentValue: args.currentReport.report.lifecycle.openPositionRate,
        favorableDirection: "down",
      }),
    ],
    behaviorDeltas,
  };
}

export function buildTraderFocusQueue(args: {
  report: SavedTraderAnalyticsReport;
  drillDowns: TraderAnalyticsDrillDown[];
}): TraderFocusQueueItem[] {
  const items: TraderFocusQueueItem[] = [];
  let rank = 1;

  for (const risk of args.report.report.topRisks.slice(0, 4)) {
    const drillDown = args.drillDowns.find(
      (candidate) => candidate.sourceMetricId === risk.id,
    );

    items.push({
      id: `focus:risk:${risk.id}`,
      rank,
      kind: "risk",
      title: `Review ${risk.label}`,
      summary: `${risk.label} appeared in ${risk.count} reviewed trade${risk.count === 1 ? "" : "s"}.`,
      whyItMatters: risk.summary,
      relatedTradeIds: drillDown?.tradeIds ?? [],
      relatedTradeIndexes: drillDown?.rows.map((row) => row.tradeIndex) ?? [],
      suggestedReviewAction:
        "Open the related trades and review the sequence before the first reduction or exit.",
      status: "new",
    });
    rank += 1;
  }

  for (const strength of args.report.report.topStrengths.slice(0, 2)) {
    const drillDown = args.drillDowns.find(
      (candidate) => candidate.sourceMetricId === strength.id,
    );

    items.push({
      id: `focus:strength:${strength.id}`,
      rank,
      kind: "strength",
      title: `Preserve ${strength.label}`,
      summary: `${strength.label} appeared in ${strength.count} reviewed trade${strength.count === 1 ? "" : "s"}.`,
      whyItMatters: strength.summary,
      relatedTradeIds: drillDown?.tradeIds ?? [],
      relatedTradeIndexes: drillDown?.rows.map((row) => row.tradeIndex) ?? [],
      suggestedReviewAction:
        "Review the related trades and note what made this execution behavior repeatable.",
      status: "new",
    });
    rank += 1;
  }

  return items.slice(0, 5);
}

export function buildSavedTradeReviewViewModel(args: {
  trade: SavedExecutionTrade;
  report?: SavedTraderAnalyticsReport | null;
}): SavedTradeReviewViewModel {
  const summaryRef = args.report?.sourceSummaries.find(
    (candidate) => candidate.tradeId === args.trade.id,
  );
  const reportRow =
    args.report && summaryRef
      ? tradeRowsWithIds(args.report).find((row) => row.tradeId === args.trade.id) ??
        null
      : null;
  const directionMultiplier =
    String(args.trade.tradeDirection).toLowerCase() === "short" ? -1 : 1;
  let position = 0;
  const executions = [...args.trade.request.executions].sort((left, right) =>
    String(left.timestamp).localeCompare(String(right.timestamp)),
  );
  const executionTimeline = executions.map((execution, index) => {
    const side = String(execution.side).toLowerCase();
    const shares = Number(execution.shares);
    const signedShares = side === "buy" ? shares : -shares;
    position += signedShares * directionMultiplier;

    return {
      index,
      timestamp: String(execution.timestamp),
      side,
      shares,
      price: Number(execution.price),
      positionAfterExecution: position,
    };
  });

  return {
    trade: args.trade,
    reportId: args.report?.id ?? null,
    reportRow,
    summary: summaryRef?.summary ?? null,
    executionTimeline,
    risks: summaryRef?.summary.points.risks.map(pointDigest) ?? [],
    strengths: summaryRef?.summary.points.strengths.map(pointDigest) ?? [],
    journalPrompts: buildTradeJournalPrompts({
      trade: args.trade,
      summary: summaryRef?.summary ?? null,
      reportRow,
    }),
  };
}
