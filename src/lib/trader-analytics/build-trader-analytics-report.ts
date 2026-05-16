import { buildTraderAnalyticsChartData } from "./charts/build-trader-analytics-chart-data";
import { mapUserFacingBehavior } from "../user-facing-behavior";
import type { ExecutionFeedbackSummary } from "../execution-feedback/summary/build-execution-feedback-summary";
import type { ExecutionFeedbackPoint } from "../execution-feedback/types/execution-feedback-point";
import type {
  BuildTraderAnalyticsReportArgs,
  TraderAnalyticsCategoryDistribution,
  TraderAnalyticsCompletedSummaryInput,
  TraderAnalyticsExecutionBehaviorMetrics,
  TraderAnalyticsLifecycleMetrics,
  TraderAnalyticsPnlMetrics,
  TraderAnalyticsPointCategory,
  TraderAnalyticsPointCount,
  TraderAnalyticsPointDigest,
  TraderAnalyticsReport,
  TraderAnalyticsSampleSizeMetrics,
  TraderAnalyticsReportSummaryInput,
  TraderAnalyticsStrengthMetrics,
  TraderAnalyticsTimeBucketConclusion,
  TraderAnalyticsTimeBucketMetrics,
  TraderAnalyticsTimeBucketSampleSizeLabel,
  TraderAnalyticsTimeOfDayMetrics,
  TraderAnalyticsTradeExtreme,
  TraderAnalyticsTradeRow,
} from "./types/trader-analytics-report";

export const TRADER_ANALYTICS_REPORT_LIMITATIONS = [
  "This report aggregates execution-feedback summaries only.",
  "Gross P/L excludes commissions, fees, borrow costs, and slippage.",
  "Market context, support/resistance, VWAP/EMA, and candle structure were not used unless explicitly shown in a market-context section.",
  "Small sample sizes should be treated as review prompts, not statistical proof.",
  "Trader identity and long-term behavior conclusions require more reviewed trades.",
] as const;

const CATEGORY_LABELS: Record<TraderAnalyticsPointCategory, string> = {
  position_construction: "Position Construction",
  size_discipline: "Size Discipline",
  risk_reduction: "Risk Reduction",
  exit_structure: "Exit Structure",
  timing: "Timing",
  pnl: "P/L",
};

const CATEGORY_ORDER: TraderAnalyticsPointCategory[] = [
  "position_construction",
  "size_discipline",
  "risk_reduction",
  "exit_structure",
  "timing",
  "pnl",
];

const RISK_POINT_IDS = {
  multipleAddsBeforeReduction: "multiple_adds_before_first_reduction",
  adversePriceAdd: "size_expansion_after_adverse_price",
  overbuiltPosition: "overbuilt_position",
  largeLateAdd: "large_late_add",
  openPositionLeftover: "open_position_leftover",
  rapidFireExecution: "rapid_fire_execution_cluster",
  inconsistentShareSizing: "inconsistent_share_sizing",
  smallFirstRiskReduction: "small_first_risk_reduction",
  allOrNothingExitAfterManyAdds: "all_or_nothing_exit_after_many_adds",
  losingReductionSequence: "losing_reduction_sequence",
} as const;

const STRENGTH_POINT_IDS = {
  cleanSingleEntryFullExit: "clean_single_entry_full_exit",
  controlledScaleIn: "controlled_scale_in",
  structuredPartialExitSequence: "structured_partial_exit_sequence",
  earlyPositionRiskReduction: "early_position_risk_reduction",
  decisiveFullExit: "decisive_full_exit",
  consistentShareSizing: "consistent_share_sizing",
  profitableReductionSequence: "profitable_reduction_sequence",
} as const;

const MIN_TIMING_BUCKET_TRADES_FOR_REVIEW = 5;
const MIN_TIMING_BUCKET_TRADES_FOR_PATTERN = 10;
const OUTLIER_ABSOLUTE_SHARE_THRESHOLD = 0.6;
const WEAK_TIMING_WIN_RATE_THRESHOLD = 0.4;
const STRONG_TIMING_WIN_RATE_THRESHOLD = 0.6;

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function rate(count: number, denominator: number): number | null {
  return denominator > 0 ? roundMetric(count / denominator) : null;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number | null {
  return values.length > 0 ? roundMetric(sum(values) / values.length) : null;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return roundMetric(sorted[middle]);
  }

  return roundMetric((sorted[middle - 1] + sorted[middle]) / 2);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() !== ""))].sort();
}

function toPointDigest(point: ExecutionFeedbackPoint): TraderAnalyticsPointDigest {
  const behavior = mapUserFacingBehavior({
    behaviorId: point.id,
    rawLabel: point.label,
    route: "/analytics",
  });

  return {
    id: point.id,
    kind: point.kind,
    category: point.category,
    label: behavior.label,
    summary: behavior.canDrivePrimaryConclusion
      ? behavior.plainExplanation
      : behavior.unsupportedFallback,
    behaviorState: behavior.state,
    behaviorTone: behavior.tone,
    opportunityType: behavior.opportunityType,
    evidenceChannel: behavior.evidenceChannel,
    canDrivePrimaryConclusion: behavior.canDrivePrimaryConclusion,
    missingDataSentence: behavior.missingDataSentence,
    fixFirstAction: behavior.fixFirstAction,
    severity: point.severity,
    confidence: point.confidence,
    priorityScore: point.priorityScore,
  };
}

function toPrimaryPointDigest(
  point: ExecutionFeedbackPoint | null | undefined,
): TraderAnalyticsPointDigest | null {
  if (!point) {
    return null;
  }

  const digest = toPointDigest(point);

  return digest.canDrivePrimaryConclusion ? digest : null;
}

function isCompletedSummaryInput(
  input: TraderAnalyticsReportSummaryInput,
): input is TraderAnalyticsCompletedSummaryInput {
  return (
    typeof input === "object" &&
    input !== null &&
    "summary" in input &&
    typeof input.summary === "object" &&
    input.summary !== null
  );
}

function normalizeSummaryInputs(
  inputs: TraderAnalyticsReportSummaryInput[],
): Array<{ requestIndex: number; summary: ExecutionFeedbackSummary }> {
  return inputs.map((input, index) => {
    if (isCompletedSummaryInput(input)) {
      return {
        requestIndex: input.requestIndex ?? index,
        summary: input.summary,
      };
    }

    return {
      requestIndex: index,
      summary: input,
    };
  });
}

function hasPoint(summary: ExecutionFeedbackSummary, id: string): boolean {
  return [
    ...summary.points.context,
    ...summary.points.strengths,
    ...summary.points.risks,
  ].some((point) => point.id === id);
}

function countSummariesWithPoint(
  summaries: ExecutionFeedbackSummary[],
  id: string,
): number {
  return summaries.filter((summary) => hasPoint(summary, id)).length;
}

function buildPointCounts(args: {
  summaries: ExecutionFeedbackSummary[];
  denominator: number;
  getPoints: (summary: ExecutionFeedbackSummary) => ExecutionFeedbackPoint[];
}): TraderAnalyticsPointCount[] {
  const counts = new Map<string, TraderAnalyticsPointCount>();

  for (const summary of args.summaries) {
    const seenIds = new Set<string>();

    for (const point of args.getPoints(summary)) {
      if (seenIds.has(point.id)) {
        continue;
      }

      seenIds.add(point.id);

      const existing = counts.get(point.id);
      const digest = toPointDigest(point);

      if (!digest.canDrivePrimaryConclusion) {
        continue;
      }

      counts.set(point.id, {
        ...(existing && existing.priorityScore > digest.priorityScore
          ? existing
          : digest),
        count: (existing?.count ?? 0) + 1,
        tradeRate: rate((existing?.count ?? 0) + 1, args.denominator) ?? 0,
      });
    }
  }

  return [...counts.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }

    return left.label.localeCompare(right.label);
  });
}

function takeTop(points: TraderAnalyticsPointCount[], count: number): TraderAnalyticsPointCount[] {
  return points.slice(0, count);
}

function toExtreme(row: TraderAnalyticsTradeRow): TraderAnalyticsTradeExtreme {
  return {
    tradeIndex: row.tradeIndex,
    requestIndex: row.requestIndex,
    symbol: row.symbol,
    tradeDirection: row.tradeDirection,
    grossRealizedPnl: row.grossRealizedPnl,
  };
}

function timingSampleSizeLabel(
  tradeCount: number,
): TraderAnalyticsTimeBucketSampleSizeLabel {
  if (tradeCount < MIN_TIMING_BUCKET_TRADES_FOR_REVIEW) {
    return "insufficient";
  }

  if (tradeCount < MIN_TIMING_BUCKET_TRADES_FOR_PATTERN) {
    return "limited";
  }

  return "sufficient";
}

function largestByPnl(
  rows: TraderAnalyticsTradeRow[],
): TraderAnalyticsTradeRow | null {
  return (
    [...rows]
      .filter((row) => row.grossRealizedPnl > 0)
      .sort((left, right) => right.grossRealizedPnl - left.grossRealizedPnl)[0] ??
    null
  );
}

function smallestByPnl(
  rows: TraderAnalyticsTradeRow[],
): TraderAnalyticsTradeRow | null {
  return (
    [...rows]
      .filter((row) => row.grossRealizedPnl < 0)
      .sort((left, right) => left.grossRealizedPnl - right.grossRealizedPnl)[0] ??
    null
  );
}

function largestByAbsolutePnl(
  rows: TraderAnalyticsTradeRow[],
): TraderAnalyticsTradeRow | null {
  return (
    [...rows].sort(
      (left, right) =>
        Math.abs(right.grossRealizedPnl) - Math.abs(left.grossRealizedPnl) ||
        left.tradeIndex - right.tradeIndex,
    )[0] ?? null
  );
}

function buildTimingBucketConclusion(args: {
  tradeCount: number;
  grossTotalRealizedPnl: number;
  grossAverageRealizedPnl: number | null;
  grossMedianRealizedPnl: number | null;
  grossWinRate: number | null;
  largestAbsoluteTradeShareOfAbsolutePnl: number | null;
}): TraderAnalyticsTimeBucketConclusion {
  if (args.tradeCount < MIN_TIMING_BUCKET_TRADES_FOR_REVIEW) {
    return {
      kind: "insufficient_sample",
      confidence: "low",
      summary: "Not enough trades for a timing pattern yet.",
    };
  }

  if (
    args.largestAbsoluteTradeShareOfAbsolutePnl !== null &&
    args.largestAbsoluteTradeShareOfAbsolutePnl >=
      OUTLIER_ABSOLUTE_SHARE_THRESHOLD
  ) {
    return {
      kind: "outlier_dominated_total",
      confidence: "medium",
      summary:
        "One trade drove most of this bucket's movement. Review the driver before treating it as a timing pattern.",
    };
  }

  const hasPatternSample =
    args.tradeCount >= MIN_TIMING_BUCKET_TRADES_FOR_PATTERN;
  const hasWeakWinRate =
    args.grossWinRate !== null &&
    args.grossWinRate < WEAK_TIMING_WIN_RATE_THRESHOLD;
  const hasStrongWinRate =
    args.grossWinRate !== null &&
    args.grossWinRate > STRONG_TIMING_WIN_RATE_THRESHOLD;

  if (
    hasPatternSample &&
    args.grossTotalRealizedPnl < 0 &&
    (args.grossAverageRealizedPnl ?? 0) < 0 &&
    (args.grossMedianRealizedPnl ?? 0) < 0 &&
    hasWeakWinRate
  ) {
    return {
      kind: "consistent_weakness",
      confidence: "high",
      summary:
        "Total, average, median, and win rate all point to repeated weakness.",
    };
  }

  if (
    hasPatternSample &&
    args.grossTotalRealizedPnl > 0 &&
    (args.grossAverageRealizedPnl ?? 0) > 0 &&
    (args.grossMedianRealizedPnl ?? 0) > 0 &&
    hasStrongWinRate
  ) {
    return {
      kind: "consistent_strength",
      confidence: "high",
      summary:
        "Total, average, median, and win rate all point to repeated strength.",
    };
  }

  return {
    kind: "mixed",
    confidence: "low",
    summary: "Mixed timing evidence; use this as a review prompt.",
  };
}

function buildTradeRows(
  inputs: Array<{ requestIndex: number; summary: ExecutionFeedbackSummary }>,
): TraderAnalyticsTradeRow[] {
  return inputs.map((input, index) => {
    const summary = input.summary;

    return {
      tradeIndex: index + 1,
      requestIndex: input.requestIndex,
      symbol: summary.symbol,
      tradeDirection: summary.tradeDirection,
      sessionDate: summary.sessionDate,
      sessionBucket: summary.sessionBucket,
      entrySessionBucket: summary.entrySessionBucket ?? summary.sessionBucket,
      entrySessionDateEt: summary.entrySessionDateEt ?? summary.sessionDate,
      entryTimeEt: summary.entryTimeEt ?? "",
      entryHourEt: summary.entryHourEt ?? null,
      entryHourLabelEt: summary.entryHourLabelEt ?? "",
      sessionExposure: summary.sessionExposure ?? [],
      heldSessionBuckets: summary.heldSessionBuckets ?? [],
      heldHourBucketsEt: summary.heldHourBucketsEt ?? [],
      heldPremarketIntoOpen: summary.heldPremarketIntoOpen ?? false,
      heldOpenIntoMidday: summary.heldOpenIntoMidday ?? false,
      heldMiddayIntoPostmarket: summary.heldMiddayIntoPostmarket ?? false,
      heldPostmarketIntoOvernight:
        summary.heldPostmarketIntoOvernight ?? false,
      heldOvernight: summary.heldOvernight ?? false,
      executionCount: summary.executionCount,
      grossRealizedPnl: roundMetric(
        summary.executionOnlyPnl.grossRealizedPnl,
      ),
      grossRealizedPnlPctOfEntryNotional:
        summary.executionOnlyPnl.grossRealizedPnlPctOfEntryNotional === null
          ? null
          : roundMetric(
              summary.executionOnlyPnl.grossRealizedPnlPctOfEntryNotional,
            ),
      closedToFlat: summary.lifecycle.closedToFlat,
      isOpenPosition: summary.lifecycle.isOpenPosition,
      maxPositionSize: summary.lifecycle.maxPositionSize,
      finalPositionSize: summary.lifecycle.finalPositionSize,
      addCountAfterInitialEntry: summary.lifecycle.addCountAfterInitialEntry,
      reductionCount: summary.lifecycle.reductionCount,
      durationSeconds: summary.lifecycle.durationSeconds,
      adversePriceAddCount: summary.riskFacts.adversePriceAddCount,
      primaryFocus: toPrimaryPointDigest(summary.points.primaryFocus),
      topRisk: toPrimaryPointDigest(summary.points.risks[0]),
      topStrength: toPrimaryPointDigest(summary.points.strengths[0]),
      warnings: [...summary.warnings],
    };
  });
}

function buildTimeBucketMetrics(
  bucketRows: Array<{ id: string; label: string; row: TraderAnalyticsTradeRow }>,
): TraderAnalyticsTimeBucketMetrics[] {
  const buckets = new Map<string, { label: string; rows: TraderAnalyticsTradeRow[] }>();

  for (const item of bucketRows) {
    const existing = buckets.get(item.id);

    buckets.set(item.id, {
      label: item.label,
      rows: [...(existing?.rows ?? []), item.row],
    });
  }

  return [...buckets.entries()]
    .map(([id, bucket]) => {
      const pnlValues = bucket.rows.map((row) => row.grossRealizedPnl);
      const grossTotalRealizedPnl = roundMetric(sum(pnlValues));
      const grossAverageRealizedPnl = average(pnlValues);
      const grossMedianRealizedPnl = median(pnlValues);
      const grossAbsoluteRealizedPnl = roundMetric(
        sum(pnlValues.map((value) => Math.abs(value))),
      );
      const grossWinnerCount = bucket.rows.filter(
        (row) => row.grossRealizedPnl > 0,
      ).length;
      const grossLoserCount = bucket.rows.filter(
        (row) => row.grossRealizedPnl < 0,
      ).length;
      const grossFlatCount = bucket.rows.filter(
        (row) => row.grossRealizedPnl === 0,
      ).length;
      const grossWinRate = rate(grossWinnerCount, bucket.rows.length);
      const largestWinner = largestByPnl(bucket.rows);
      const largestLoser = smallestByPnl(bucket.rows);
      const largestAbsoluteTrade = largestByAbsolutePnl(bucket.rows);
      const largestAbsoluteTradeShareOfAbsolutePnl =
        largestAbsoluteTrade && grossAbsoluteRealizedPnl > 0
          ? roundMetric(
              Math.abs(largestAbsoluteTrade.grossRealizedPnl) /
                grossAbsoluteRealizedPnl,
            )
          : null;

      return {
        id,
        label: bucket.label,
        tradeCount: bucket.rows.length,
        grossTotalRealizedPnl,
        grossAverageRealizedPnl,
        grossMedianRealizedPnl,
        grossAbsoluteRealizedPnl,
        grossWinnerCount,
        grossLoserCount,
        grossFlatCount,
        grossWinRate,
        largestWinner: largestWinner ? toExtreme(largestWinner) : null,
        largestLoser: largestLoser ? toExtreme(largestLoser) : null,
        largestAbsoluteTrade: largestAbsoluteTrade
          ? toExtreme(largestAbsoluteTrade)
          : null,
        largestAbsoluteTradeShareOfAbsolutePnl,
        sampleSizeLabel: timingSampleSizeLabel(bucket.rows.length),
        conclusion: buildTimingBucketConclusion({
          tradeCount: bucket.rows.length,
          grossTotalRealizedPnl,
          grossAverageRealizedPnl,
          grossMedianRealizedPnl,
          grossWinRate,
          largestAbsoluteTradeShareOfAbsolutePnl,
        }),
      };
    })
    .sort((left, right) => {
      const sessionOrder: Record<string, number> = {
        overnight: 0,
        pre_market: 1,
        market_open: 2,
        midday: 3,
        post_market: 4,
        after_hours: 5,
        close: 6,
        unknown: 99,
      };
      const leftOrder = sessionOrder[left.id] ?? Number(left.id);
      const rightOrder = sessionOrder[right.id] ?? Number(right.id);

      if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder)) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label);
    });
}

function buildTimeOfDayMetrics(
  rows: TraderAnalyticsTradeRow[],
): TraderAnalyticsTimeOfDayMetrics {
  const entrySessionRows = rows.map((row) => ({
    id: String(row.entrySessionBucket || row.sessionBucket),
    label: String(row.entrySessionBucket || row.sessionBucket),
    row,
  }));
  const entryHourRows = rows
    .filter((row) => row.entryHourEt !== null)
    .map((row) => ({
      id: String(row.entryHourEt).padStart(2, "0"),
      label: row.entryHourLabelEt || `${String(row.entryHourEt).padStart(2, "0")}:00 ET`,
      row,
    }));
  const heldSessionRows = rows.flatMap((row) =>
    row.heldSessionBuckets.map((bucket) => ({
      id: String(bucket),
      label: String(bucket),
      row,
    })),
  );
  const entrySessionBuckets = buildTimeBucketMetrics(entrySessionRows);
  const entryHoursEt = buildTimeBucketMetrics(entryHourRows);
  const heldSessionBuckets = buildTimeBucketMetrics(heldSessionRows);
  const bestEntrySession = bestBucket(entrySessionBuckets);
  const worstEntrySession = worstBucket(entrySessionBuckets);
  const bestEntryHourEt = bestBucket(entryHoursEt);
  const worstEntryHourEt = worstBucket(entryHoursEt);
  const sampleSizeWarning = rows.length < 10;
  const crossSessionHolds = {
    heldPremarketIntoOpenCount: rows.filter(
      (row) => row.heldPremarketIntoOpen,
    ).length,
    heldOpenIntoMiddayCount: rows.filter((row) => row.heldOpenIntoMidday)
      .length,
    heldMiddayIntoPostmarketCount: rows.filter(
      (row) => row.heldMiddayIntoPostmarket,
    ).length,
    heldPostmarketIntoOvernightCount: rows.filter(
      (row) => row.heldPostmarketIntoOvernight,
    ).length,
    heldOvernightCount: rows.filter((row) => row.heldOvernight).length,
  };

  return {
    entrySessionBuckets,
    entryHoursEt,
    heldSessionBuckets,
    bestEntrySession,
    worstEntrySession,
    bestEntryHourEt,
    worstEntryHourEt,
    entryInsight: buildEntryTimeInsight({
      bestEntrySession,
      worstEntrySession,
      bestEntryHourEt,
      sampleSizeWarning,
    }),
    holdInsight: buildHoldInsight({
      crossSessionHolds,
      sampleSize: rows.length,
    }),
    sampleSizeWarning,
    crossSessionHolds,
  };
}

function bestBucket(
  buckets: TraderAnalyticsTimeBucketMetrics[],
): TraderAnalyticsTimeBucketMetrics | null {
  return (
    [...buckets]
      .filter((bucket) => bucket.tradeCount > 0)
      .sort(
        (left, right) =>
          right.grossTotalRealizedPnl - left.grossTotalRealizedPnl ||
          right.tradeCount - left.tradeCount,
      )[0] ?? null
  );
}

function worstBucket(
  buckets: TraderAnalyticsTimeBucketMetrics[],
): TraderAnalyticsTimeBucketMetrics | null {
  return (
    [...buckets]
      .filter((bucket) => bucket.tradeCount > 0)
      .sort(
        (left, right) =>
          left.grossTotalRealizedPnl - right.grossTotalRealizedPnl ||
          right.tradeCount - left.tradeCount,
      )[0] ?? null
  );
}

function buildEntryTimeInsight(args: {
  bestEntrySession: TraderAnalyticsTimeBucketMetrics | null;
  worstEntrySession: TraderAnalyticsTimeBucketMetrics | null;
  bestEntryHourEt: TraderAnalyticsTimeBucketMetrics | null;
  sampleSizeWarning: boolean;
}): string {
  if (!args.bestEntrySession) {
    return "Import execution trades to compare entry session performance.";
  }

  const hour = args.bestEntryHourEt
    ? ` Highest total entry-hour result so far is ${args.bestEntryHourEt.label}.`
    : "";
  const worst =
    args.worstEntrySession &&
    args.worstEntrySession.id !== args.bestEntrySession.id
      ? ` Lowest total entry-session result so far is ${args.worstEntrySession.label}.`
      : "";
  const outlierNote =
    args.worstEntrySession?.conclusion.kind === "outlier_dominated_total"
      ? ` ${args.worstEntrySession.label} is mostly driven by one trade, so review that trade before treating it as a timing pattern.`
      : "";
  const insufficientNote =
    args.worstEntrySession?.conclusion.kind === "insufficient_sample"
      ? ` ${args.worstEntrySession.label} has too few trades for a timing pattern yet.`
      : "";
  const consistentWeaknessNote =
    args.worstEntrySession?.conclusion.kind === "consistent_weakness"
      ? ` ${args.worstEntrySession.label} also shows weaker average, median, and win-rate evidence across enough trades.`
      : "";
  const sampleNote = args.sampleSizeWarning
    ? " Treat this as a review prompt until the sample is larger."
    : " Check average, median, win rate, and outlier notes before calling this a timing pattern.";

  return `Highest total entry-session result so far is ${args.bestEntrySession.label}.${hour}${worst}${outlierNote}${insufficientNote}${consistentWeaknessNote}${sampleNote}`;
}

function buildHoldInsight(args: {
  crossSessionHolds: TraderAnalyticsTimeOfDayMetrics["crossSessionHolds"];
  sampleSize: number;
}): string {
  const entries = [
    ["pre-market into open", args.crossSessionHolds.heldPremarketIntoOpenCount],
    ["open into midday", args.crossSessionHolds.heldOpenIntoMiddayCount],
    ["midday into post-market", args.crossSessionHolds.heldMiddayIntoPostmarketCount],
    ["post-market into overnight", args.crossSessionHolds.heldPostmarketIntoOvernightCount],
    ["overnight", args.crossSessionHolds.heldOvernightCount],
  ] as const;
  const top = [...entries].sort((left, right) => right[1] - left[1])[0];

  if (!top || top[1] === 0) {
    return "No cross-session holds are present in this sample.";
  }

  return `${top[1]} of ${args.sampleSize} trade${args.sampleSize === 1 ? "" : "s"} touched ${top[0]}; review held-through exposure separately from entry-session P/L.`;
}

function buildPnlMetrics(rows: TraderAnalyticsTradeRow[]): TraderAnalyticsPnlMetrics {
  const pnlValues = rows.map((row) => row.grossRealizedPnl);
  const best = rows.reduce<TraderAnalyticsTradeRow | null>((current, row) => {
    if (!current || row.grossRealizedPnl > current.grossRealizedPnl) {
      return row;
    }

    return current;
  }, null);
  const worst = rows.reduce<TraderAnalyticsTradeRow | null>((current, row) => {
    if (!current || row.grossRealizedPnl < current.grossRealizedPnl) {
      return row;
    }

    return current;
  }, null);
  const grossWinnerCount = rows.filter((row) => row.grossRealizedPnl > 0).length;
  const grossLoserCount = rows.filter((row) => row.grossRealizedPnl < 0).length;
  const grossFlatCount = rows.filter((row) => row.grossRealizedPnl === 0).length;

  return {
    grossTotalRealizedPnl: roundMetric(sum(pnlValues)),
    grossAverageRealizedPnl: average(pnlValues),
    grossMedianRealizedPnl: median(pnlValues),
    grossWinnerCount,
    grossLoserCount,
    grossFlatCount,
    grossWinRate: rate(grossWinnerCount, rows.length),
    bestGrossTrade: best ? toExtreme(best) : null,
    worstGrossTrade: worst ? toExtreme(worst) : null,
    commissionsAndFeesIncluded: false,
  };
}

function buildLifecycleMetrics(
  summaries: ExecutionFeedbackSummary[],
): TraderAnalyticsLifecycleMetrics {
  const openPositionTradeCount = summaries.filter(
    (summary) => summary.lifecycle.isOpenPosition,
  ).length;
  const closedToFlatTradeCount = summaries.filter(
    (summary) => summary.lifecycle.closedToFlat,
  ).length;

  return {
    openPositionTradeCount,
    closedToFlatTradeCount,
    openPositionRate: rate(openPositionTradeCount, summaries.length),
    averageMaxPositionSize: average(
      summaries.map((summary) => summary.lifecycle.maxPositionSize),
    ),
    averageFinalPositionSize: average(
      summaries.map((summary) => summary.lifecycle.finalPositionSize),
    ),
    averageDurationSeconds: average(
      summaries.map((summary) => summary.lifecycle.durationSeconds),
    ),
    medianDurationSeconds: median(
      summaries.map((summary) => summary.lifecycle.durationSeconds),
    ),
  };
}

function buildExecutionBehaviorMetrics(
  summaries: ExecutionFeedbackSummary[],
): TraderAnalyticsExecutionBehaviorMetrics {
  const adversePriceAddTradeCount = countSummariesWithPoint(
    summaries,
    RISK_POINT_IDS.adversePriceAdd,
  );
  const multipleAddsBeforeReductionTradeCount = countSummariesWithPoint(
    summaries,
    RISK_POINT_IDS.multipleAddsBeforeReduction,
  );

  return {
    adversePriceAddTradeCount,
    adversePriceAddRate: rate(adversePriceAddTradeCount, summaries.length),
    multipleAddsBeforeReductionTradeCount,
    multipleAddsBeforeReductionRate: rate(
      multipleAddsBeforeReductionTradeCount,
      summaries.length,
    ),
    overbuiltPositionTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.overbuiltPosition,
    ),
    openPositionLeftoverTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.openPositionLeftover,
    ),
    rapidFireExecutionTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.rapidFireExecution,
    ),
    inconsistentShareSizingTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.inconsistentShareSizing,
    ),
    largeLateAddTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.largeLateAdd,
    ),
    smallFirstRiskReductionTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.smallFirstRiskReduction,
    ),
    allOrNothingExitAfterManyAddsTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.allOrNothingExitAfterManyAdds,
    ),
    losingReductionSequenceTradeCount: countSummariesWithPoint(
      summaries,
      RISK_POINT_IDS.losingReductionSequence,
    ),
  };
}

function buildStrengthMetrics(
  summaries: ExecutionFeedbackSummary[],
): TraderAnalyticsStrengthMetrics {
  return {
    cleanSingleEntryFullExitCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.cleanSingleEntryFullExit,
    ),
    controlledScaleInCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.controlledScaleIn,
    ),
    structuredPartialExitSequenceCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.structuredPartialExitSequence,
    ),
    earlyPositionRiskReductionCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.earlyPositionRiskReduction,
    ),
    decisiveFullExitCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.decisiveFullExit,
    ),
    consistentShareSizingCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.consistentShareSizing,
    ),
    profitableReductionSequenceCount: countSummariesWithPoint(
      summaries,
      STRENGTH_POINT_IDS.profitableReductionSequence,
    ),
  };
}

function buildCategoryDistributions(
  summaries: ExecutionFeedbackSummary[],
): TraderAnalyticsCategoryDistribution[] {
  const categories = new Map<
    TraderAnalyticsPointCategory,
    TraderAnalyticsCategoryDistribution
  >(
    CATEGORY_ORDER.map((category) => [
      category,
      {
        category,
        label: CATEGORY_LABELS[category],
        contextCount: 0,
        riskCount: 0,
        strengthCount: 0,
        primaryFocusCount: 0,
        totalCount: 0,
      },
    ]),
  );

  function update(
    category: TraderAnalyticsPointCategory,
    key: keyof Pick<
      TraderAnalyticsCategoryDistribution,
      "contextCount" | "riskCount" | "strengthCount" | "primaryFocusCount"
    >,
  ): void {
    const row = categories.get(category);

    if (!row) {
      return;
    }

    row[key] += 1;
    row.totalCount += 1;
  }

  for (const summary of summaries) {
    for (const point of summary.points.context) {
      update(point.category, "contextCount");
    }

    for (const point of summary.points.risks) {
      if (toPointDigest(point).canDrivePrimaryConclusion) {
        update(point.category, "riskCount");
      }
    }

    for (const point of summary.points.strengths) {
      if (toPointDigest(point).canDrivePrimaryConclusion) {
        update(point.category, "strengthCount");
      }
    }

    if (
      summary.points.primaryFocus &&
      toPointDigest(summary.points.primaryFocus).canDrivePrimaryConclusion
    ) {
      update(summary.points.primaryFocus.category, "primaryFocusCount");
    }
  }

  return CATEGORY_ORDER.map((category) => categories.get(category)).filter(
    (category): category is TraderAnalyticsCategoryDistribution =>
      category !== undefined,
  );
}

function buildPointIdRecord(points: TraderAnalyticsPointCount[]): Record<string, number> {
  return points.reduce<Record<string, number>>((record, point) => {
    record[point.id] = point.count;
    return record;
  }, {});
}

function buildWarnings(args: {
  summaries: ExecutionFeedbackSummary[];
  failures: BuildTraderAnalyticsReportArgs["failures"];
  extraWarnings: string[];
}): string[] {
  const warnings = new Set<string>();

  for (const warning of args.extraWarnings) {
    warnings.add(warning);
  }

  for (const summary of args.summaries) {
    for (const warning of summary.warnings) {
      warnings.add(warning);
    }
  }

  if (args.summaries.length === 0) {
    warnings.add(
      "No completed execution-feedback summaries were available for aggregation.",
    );
  }

  if ((args.failures?.length ?? 0) > 0) {
    warnings.add(
      "Some requests failed validation or execution-feedback generation and were excluded from aggregate metrics.",
    );
  }

  return [...warnings];
}

function buildSessionDateRange(
  summaries: ExecutionFeedbackSummary[],
): TraderAnalyticsSampleSizeMetrics["sessionDateRange"] {
  const dates = uniqueSorted(summaries.map((summary) => summary.sessionDate));

  if (dates.length === 0) {
    return null;
  }

  return {
    firstSessionDate: dates[0],
    lastSessionDate: dates[dates.length - 1],
  };
}

export function buildTraderAnalyticsReport(
  args: BuildTraderAnalyticsReportArgs,
): TraderAnalyticsReport {
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const inputs = normalizeSummaryInputs(args.summaries);
  const summaries = inputs.map((input) => input.summary);
  const trades = buildTradeRows(inputs);
  const completedTradeCount = summaries.length;
  const failedTradeCount = args.failedTradeCount ?? args.failures?.length ?? 0;
  const validatedOnlyCount = args.validatedOnlyCount ?? 0;
  const requestCount =
    args.requestCount ??
    completedTradeCount + failedTradeCount + validatedOnlyCount;
  const validationWarningCount = args.validationWarningCount ?? 0;
  const summaryWarningCount = summaries.reduce(
    (total, summary) => total + summary.warnings.length,
    0,
  );
  const pnl = buildPnlMetrics(trades);
  const timeOfDay = buildTimeOfDayMetrics(trades);
  const lifecycle = buildLifecycleMetrics(summaries);
  const executionBehavior = buildExecutionBehaviorMetrics(summaries);
  const strengths = buildStrengthMetrics(summaries);
  const riskCounts = buildPointCounts({
    summaries,
    denominator: completedTradeCount,
    getPoints: (summary) => summary.points.risks,
  });
  const strengthCounts = buildPointCounts({
    summaries,
    denominator: completedTradeCount,
    getPoints: (summary) => summary.points.strengths,
  });
  const primaryFocusCounts = buildPointCounts({
    summaries,
    denominator: completedTradeCount,
    getPoints: (summary) =>
      summary.points.primaryFocus ? [summary.points.primaryFocus] : [],
  });
  const categories = buildCategoryDistributions(summaries);
  const topRisks = takeTop(riskCounts, 8);
  const topStrengths = takeTop(strengthCounts, 8);
  const failures = args.failures ?? [];

  const riskIds = buildPointIdRecord(riskCounts);
  const strengthIds = buildPointIdRecord(strengthCounts);
  const primaryFocusIds = buildPointIdRecord(primaryFocusCounts);

  return {
    contractVersion: "trader_analytics_report_v1",
    dataSource: "execution_feedback_summaries",
    inputMode: args.inputMode ?? "raw_trade_requests",
    source: args.source,
    generatedAt,
    sampleSize: {
      requestCount,
      validatedTradeCount: completedTradeCount + validatedOnlyCount,
      completedTradeCount,
      failedTradeCount,
      validatedOnlyCount,
      warningCount: validationWarningCount + summaryWarningCount,
      symbols: uniqueSorted(summaries.map((summary) => summary.symbol)),
      sessionBuckets: uniqueSorted(
        summaries.map((summary) => summary.sessionBucket),
      ),
      tradeDirections: uniqueSorted(
        summaries.map((summary) => summary.tradeDirection),
      ),
      sessionDateRange: buildSessionDateRange(summaries),
    },
    pnl,
    timeOfDay,
    lifecycle,
    executionBehavior,
    strengths,
    distributions: {
      categories,
      riskIds,
      strengthIds,
      primaryFocusIds,
    },
    topRisks,
    topStrengths,
    primaryFocusCounts,
    trades,
    charts: buildTraderAnalyticsChartData({
      trades,
      pnl,
      lifecycle,
      timeOfDay,
      executionBehavior,
      topRisks,
      topStrengths,
      primaryFocusCounts,
      categories,
    }),
    sourceBatch: {
      contractVersion:
        args.inputMode === "execution_feedback_summaries"
          ? null
          : "batch_execution_feedback_v1",
      validateOnly: args.validateOnly ?? false,
      failureCounts: args.failureCounts ?? {},
      failures,
    },
    warnings: buildWarnings({
      summaries,
      failures,
      extraWarnings: args.warnings ?? [],
    }),
    limitations: [...TRADER_ANALYTICS_REPORT_LIMITATIONS],
  };
}
