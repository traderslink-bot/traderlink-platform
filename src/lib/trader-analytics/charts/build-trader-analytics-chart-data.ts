import type {
  TraderAnalyticsCategoryDistribution,
  TraderAnalyticsExecutionBehaviorMetrics,
  TraderAnalyticsLifecycleMetrics,
  TraderAnalyticsPnlMetrics,
  TraderAnalyticsPointCount,
  TraderAnalyticsTimeOfDayMetrics,
  TraderAnalyticsTradeRow,
} from "../types/trader-analytics-report";
import type {
  TraderAnalyticsChart,
  TraderAnalyticsChartData,
  TraderAnalyticsChartDatum,
  TraderAnalyticsChartKind,
  TraderAnalyticsChartTone,
} from "../types/trader-analytics-chart";

export interface BuildTraderAnalyticsChartDataArgs {
  trades: TraderAnalyticsTradeRow[];
  pnl: TraderAnalyticsPnlMetrics;
  lifecycle: TraderAnalyticsLifecycleMetrics;
  executionBehavior: TraderAnalyticsExecutionBehaviorMetrics;
  timeOfDay: TraderAnalyticsTimeOfDayMetrics;
  topRisks: TraderAnalyticsPointCount[];
  topStrengths: TraderAnalyticsPointCount[];
  primaryFocusCounts: TraderAnalyticsPointCount[];
  categories: TraderAnalyticsCategoryDistribution[];
}

function buildTimeBucketChart(args: {
  id: string;
  title: string;
  buckets: TraderAnalyticsTimeOfDayMetrics["entrySessionBuckets"];
}): TraderAnalyticsChart {
  return chart({
    id: args.id,
    kind: "bar",
    title: args.title,
    total: args.buckets.reduce((total, bucket) => total + bucket.tradeCount, 0),
    data: args.buckets.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      value: bucket.grossTotalRealizedPnl,
      pctOfTotal: null,
      category: `${bucket.tradeCount} trades`,
      tone:
        bucket.grossTotalRealizedPnl > 0
          ? "positive"
          : bucket.grossTotalRealizedPnl < 0
            ? "negative"
            : "neutral",
    })),
  });
}

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

function pctOfTotal(value: number, total: number): number | null {
  return total > 0 ? roundMetric(value / total) : null;
}

function chart(args: {
  id: string;
  kind: TraderAnalyticsChartKind;
  title: string;
  total: number;
  data: TraderAnalyticsChartDatum[];
}): TraderAnalyticsChart {
  return {
    id: args.id,
    kind: args.kind,
    title: args.title,
    total: roundMetric(args.total),
    empty: args.data.length === 0 || args.data.every((datum) => datum.value === 0),
    data: args.data,
  };
}

function pointTone(point: TraderAnalyticsPointCount): TraderAnalyticsChartTone {
  if (point.kind === "risk") {
    return point.severity === "high" ? "negative" : "warning";
  }

  if (point.kind === "strength") {
    return "positive";
  }

  return "neutral";
}

function buildGrossPnlByTrade(
  trades: TraderAnalyticsTradeRow[],
): TraderAnalyticsChart {
  return chart({
    id: "gross_pnl_by_trade",
    kind: "bar",
    title: "Gross P/L By Trade",
    total: trades.reduce((total, trade) => total + trade.grossRealizedPnl, 0),
    data: trades.map((trade) => ({
      id: `trade_${trade.tradeIndex}`,
      label: `#${trade.tradeIndex} ${trade.symbol}`,
      value: roundMetric(trade.grossRealizedPnl),
      pctOfTotal: null,
      category: trade.tradeDirection,
      tone:
        trade.grossRealizedPnl > 0
          ? "positive"
          : trade.grossRealizedPnl < 0
            ? "negative"
            : "neutral",
    })),
  });
}

function buildWinLossDonut(pnl: TraderAnalyticsPnlMetrics): TraderAnalyticsChart {
  const total =
    pnl.grossWinnerCount + pnl.grossLoserCount + pnl.grossFlatCount;

  return chart({
    id: "gross_win_loss_flat",
    kind: "donut",
    title: "Gross Win / Loss / Flat",
    total,
    data: [
      {
        id: "gross_winners",
        label: "Winners",
        value: pnl.grossWinnerCount,
        pctOfTotal: pctOfTotal(pnl.grossWinnerCount, total),
        tone: "positive",
      },
      {
        id: "gross_losers",
        label: "Losers",
        value: pnl.grossLoserCount,
        pctOfTotal: pctOfTotal(pnl.grossLoserCount, total),
        tone: "negative",
      },
      {
        id: "gross_flat",
        label: "Flat",
        value: pnl.grossFlatCount,
        pctOfTotal: pctOfTotal(pnl.grossFlatCount, total),
        tone: "neutral",
      },
    ],
  });
}

function buildOpenClosedDonut(
  lifecycle: TraderAnalyticsLifecycleMetrics,
): TraderAnalyticsChart {
  const total =
    lifecycle.openPositionTradeCount + lifecycle.closedToFlatTradeCount;

  return chart({
    id: "open_closed_lifecycle",
    kind: "donut",
    title: "Closed Flat / Left Open",
    total,
    data: [
      {
        id: "closed_to_flat",
        label: "Closed Flat",
        value: lifecycle.closedToFlatTradeCount,
        pctOfTotal: pctOfTotal(lifecycle.closedToFlatTradeCount, total),
        tone: "positive",
      },
      {
        id: "open_position",
        label: "Left Open",
        value: lifecycle.openPositionTradeCount,
        pctOfTotal: pctOfTotal(lifecycle.openPositionTradeCount, total),
        tone: "warning",
      },
    ],
  });
}

function buildPointBarChart(args: {
  id: string;
  title: string;
  points: TraderAnalyticsPointCount[];
}): TraderAnalyticsChart {
  const total = args.points.reduce((sum, point) => sum + point.count, 0);

  return chart({
    id: args.id,
    kind: "bar",
    title: args.title,
    total,
    data: args.points.map((point) => ({
      id: point.id,
      label: point.label,
      value: point.count,
      pctOfTotal: pctOfTotal(point.count, total),
      category: point.category,
      tone: pointTone(point),
    })),
  });
}

function buildPrimaryFocusDistribution(
  primaryFocusCounts: TraderAnalyticsPointCount[],
): TraderAnalyticsChart {
  const total = primaryFocusCounts.reduce((sum, point) => sum + point.count, 0);

  return chart({
    id: "primary_focus_distribution",
    kind: "distribution",
    title: "Primary Focus Distribution",
    total,
    data: primaryFocusCounts.map((point) => ({
      id: point.id,
      label: point.label,
      value: point.count,
      pctOfTotal: pctOfTotal(point.count, total),
      category: point.category,
      tone: pointTone(point),
    })),
  });
}

function buildCategoryDistribution(args: {
  id: string;
  title: string;
  categories: TraderAnalyticsCategoryDistribution[];
  valueKey: "riskCount" | "strengthCount";
  tone: TraderAnalyticsChartTone;
}): TraderAnalyticsChart {
  const rows = args.categories
    .filter((category) => category[args.valueKey] > 0)
    .map((category) => ({
      id: category.category,
      label: category.label,
      value: category[args.valueKey],
      pctOfTotal: null,
      category: category.category,
      tone: args.tone,
    }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return chart({
    id: args.id,
    kind: "bar",
    title: args.title,
    total,
    data: rows.map((row) => ({
      ...row,
      pctOfTotal: pctOfTotal(row.value, total),
    })),
  });
}

function durationBucket(durationSeconds: number): {
  id: string;
  label: string;
  order: number;
} {
  if (durationSeconds < 60) {
    return { id: "under_1m", label: "< 1m", order: 0 };
  }

  if (durationSeconds < 300) {
    return { id: "1m_to_5m", label: "1m-5m", order: 1 };
  }

  if (durationSeconds < 900) {
    return { id: "5m_to_15m", label: "5m-15m", order: 2 };
  }

  if (durationSeconds < 3600) {
    return { id: "15m_to_60m", label: "15m-60m", order: 3 };
  }

  return { id: "over_60m", label: "> 60m", order: 4 };
}

function buildDurationHistogram(
  trades: TraderAnalyticsTradeRow[],
): TraderAnalyticsChart {
  const buckets = new Map<
    string,
    { label: string; value: number; order: number }
  >();

  for (const trade of trades) {
    const bucket = durationBucket(trade.durationSeconds);
    const existing = buckets.get(bucket.id);

    buckets.set(bucket.id, {
      label: bucket.label,
      order: bucket.order,
      value: (existing?.value ?? 0) + 1,
    });
  }

  const total = trades.length;

  return chart({
    id: "duration_histogram",
    kind: "histogram",
    title: "Trade Duration",
    total,
    data: [...buckets.entries()]
      .sort((left, right) => left[1].order - right[1].order)
      .map(([id, bucket]) => ({
        id,
        label: bucket.label,
        value: bucket.value,
        pctOfTotal: pctOfTotal(bucket.value, total),
        tone: "info",
      })),
  });
}

function buildBehaviorRiskRates(args: {
  executionBehavior: TraderAnalyticsExecutionBehaviorMetrics;
  totalTrades: number;
}): TraderAnalyticsChart {
  const rows = [
    {
      id: "adverse_price_adds",
      label: "Adverse Adds",
      value: args.executionBehavior.adversePriceAddTradeCount,
    },
    {
      id: "multiple_adds_before_reduction",
      label: "Repeated Adds",
      value: args.executionBehavior.multipleAddsBeforeReductionTradeCount,
    },
    {
      id: "open_position_leftover",
      label: "Left Open",
      value: args.executionBehavior.openPositionLeftoverTradeCount,
    },
    {
      id: "rapid_fire_execution_cluster",
      label: "Rapid Fire",
      value: args.executionBehavior.rapidFireExecutionTradeCount,
    },
    {
      id: "inconsistent_share_sizing",
      label: "Sizing Swings",
      value: args.executionBehavior.inconsistentShareSizingTradeCount,
    },
  ];

  return chart({
    id: "behavior_risk_rates",
    kind: "bar",
    title: "Key Execution Risk Rates",
    total: args.totalTrades,
    data: rows.map((row) => ({
      ...row,
      pctOfTotal: pctOfTotal(row.value, args.totalTrades),
      tone: row.value > 0 ? "warning" : "neutral",
    })),
  });
}

export function buildTraderAnalyticsChartData(
  args: BuildTraderAnalyticsChartDataArgs,
): TraderAnalyticsChartData {
  return {
    grossPnlByTrade: buildGrossPnlByTrade(args.trades),
    winLossDonut: buildWinLossDonut(args.pnl),
    openClosedDonut: buildOpenClosedDonut(args.lifecycle),
    topRisksBar: buildPointBarChart({
      id: "top_risks",
      title: "Top Execution Risks",
      points: args.topRisks,
    }),
    topStrengthsBar: buildPointBarChart({
      id: "top_strengths",
      title: "Top Execution Strengths",
      points: args.topStrengths,
    }),
    primaryFocusDistribution: buildPrimaryFocusDistribution(
      args.primaryFocusCounts,
    ),
    riskCategoryDistribution: buildCategoryDistribution({
      id: "risk_category_distribution",
      title: "Risk Categories",
      categories: args.categories,
      valueKey: "riskCount",
      tone: "warning",
    }),
    strengthCategoryDistribution: buildCategoryDistribution({
      id: "strength_category_distribution",
      title: "Strength Categories",
      categories: args.categories,
      valueKey: "strengthCount",
      tone: "positive",
    }),
    durationHistogram: buildDurationHistogram(args.trades),
    behaviorRiskRates: buildBehaviorRiskRates({
      executionBehavior: args.executionBehavior,
      totalTrades: args.trades.length,
    }),
    entrySessionPerformance: buildTimeBucketChart({
      id: "entry_session_performance",
      title: "Entry Session P/L",
      buckets: args.timeOfDay.entrySessionBuckets,
    }),
    entryHourPerformance: buildTimeBucketChart({
      id: "entry_hour_performance",
      title: "Entry Hour P/L",
      buckets: args.timeOfDay.entryHoursEt,
    }),
  };
}
