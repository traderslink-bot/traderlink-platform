import "server-only";

import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";
import {
  buildConfiguredDashboardQueryPlan,
  resolveConfiguredDashboardAnalytics,
} from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import type { ExactMetricValue } from "@/src/lib/trader-intelligence-v3/analytics/contracts";
import type { TradeQueryFilter } from "@/src/lib/trader-intelligence-v3/analytics/query";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";

import type {
  CalendarData,
  CalendarDay,
  CalendarFilterInput,
  CalendarTickerResult,
} from "./calendar-types";

function metricValue(metric: ExactMetricValue | undefined): number | null {
  if (metric === undefined || metric.kind === "unavailable") return null;
  if (metric.kind === "exact_decimal" || metric.kind === "integer") {
    const value = Number(metric.value);
    return Number.isFinite(value) ? value : null;
  }
  if (metric.kind === "exact_ratio") {
    const numerator = Number(metric.numerator);
    const denominator = Number(metric.denominator);
    const value = denominator === 0 ? Number.NaN : numerator / denominator;
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function readMetric(metrics: readonly ExactMetricValue[], key: string): number | null {
  return metricValue(metrics.find((metric) => metric.metricKey === key));
}

function dayFromIdentity(identity: string): string | null {
  const match = /(?:^|[|:])day:(\d{4}-\d{2}-\d{2})(?:$|[|:])/.exec(identity);
  return match?.[1] ?? null;
}

function symbolFromIdentity(identity: string): string | null {
  const match = /(?:^|[|:])symbol:([A-Z0-9._-]{1,32})(?:$|[|:])/.exec(identity);
  return match?.[1] ?? null;
}

function directFilters(input: CalendarFilterInput | undefined): TradeQueryFilter[] {
  if (!input) return [];
  const filters: TradeQueryFilter[] = [];
  if (input.startDate && input.endDate) {
    filters.push({ kind: "date_range", startDate: input.startDate, endDate: input.endDate });
  }
  if (input.symbol !== "all") filters.push({ kind: "symbol", values: [input.symbol] });
  if (input.direction !== "all") filters.push({ kind: "direction", values: [input.direction] });
  if (input.session !== "all") filters.push({ kind: "session", values: [input.session] });
  return filters;
}

function includeDay(day: CalendarDay, input: CalendarFilterInput | undefined): boolean {
  if (!input) return true;
  const pnl = day.pnl ?? 0;
  if (input.performance === "profitable" && pnl <= 0) return false;
  if (input.performance === "losing" && pnl >= 0) return false;
  if (input.pnlRange === "loss200" && pnl > -200) return false;
  if (input.pnlRange === "flat" && Math.abs(pnl) > 200) return false;
  if (input.pnlRange === "profit200" && pnl < 200) return false;
  if (input.tradeCount === "1-3" && (day.trades < 1 || day.trades > 3)) return false;
  if (input.tradeCount === "4-6" && (day.trades < 4 || day.trades > 6)) return false;
  if (input.tradeCount === "7+" && day.trades < 7) return false;
  return true;
}

export function emptyCalendarData(): CalendarData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    activeDate: today,
    currency: null,
    days: [],
    maximumDate: today,
    minimumDate: today,
    status: "unavailable",
    summary: { netPnl: 0, tradingDays: 0, trades: 0, winRate: null },
    symbols: [],
  };
}

export async function getCalendarData(input?: CalendarFilterInput): Promise<CalendarData> {
  const owner = await requireTraderIntelligenceOwnerPageAccess();
  const deployment = validateTraderIntelligenceDeployment(process.env);
  if (!deployment.ok) return emptyCalendarData();

  const analytics = resolveConfiguredDashboardAnalytics({
    config: deployment.config,
    environment: process.env,
    owner,
  });
  if (!analytics.ok) return emptyCalendarData();

  const currency = analytics.value.currencies[0];
  if (!currency) return emptyCalendarData();
  const filters = directFilters(input);
  const dayPlan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
    filters,
    grouping: { kind: "day" },
    metrics: ["net_pnl", "total_trades", "win_count", "win_rate", "maximum_peak_profit_giveback"],
  });
  const tickerPlan = buildConfiguredDashboardQueryPlan(analytics.value, currency, {
    filters,
    grouping: { kind: "compound", dimensions: [{ kind: "day" }, { kind: "symbol" }] },
    metrics: ["net_pnl", "total_trades"],
  });
  if (!dayPlan.ok || !tickerPlan.ok) return emptyCalendarData();

  const [dayPacket, tickerPacket] = [
    analytics.value.adapter.getPerformanceSeries(currency, dayPlan.value),
    analytics.value.adapter.getBreakdown(currency, tickerPlan.value),
  ];
  if (!dayPacket.ok || !tickerPacket.ok) return emptyCalendarData();

  const tickersByDay = new Map<string, CalendarTickerResult[]>();
  for (const row of tickerPacket.value.rows) {
    const date = dayFromIdentity(row.groupIdentity);
    const symbol = symbolFromIdentity(row.groupIdentity);
    const pnl = readMetric(row.metrics, "net_pnl");
    if (!date || !symbol || pnl === null) continue;
    const current = tickersByDay.get(date) ?? [];
    current.push({ pnl, symbol });
    tickersByDay.set(date, current);
  }
  for (const tickers of tickersByDay.values()) {
    tickers.sort((left, right) => Math.abs(right.pnl) - Math.abs(left.pnl));
  }

  const days = dayPacket.value.rows.flatMap((row): CalendarDay[] => {
    const date = dayFromIdentity(row.groupIdentity);
    if (!date) return [];
    return [{
      date,
      peakGiveback: readMetric(row.metrics, "maximum_peak_profit_giveback"),
      pnl: readMetric(row.metrics, "net_pnl"),
      tickers: tickersByDay.get(date) ?? [],
      trades: readMetric(row.metrics, "total_trades") ?? 0,
      winRate: readMetric(row.metrics, "win_rate"),
    }];
  }).filter((day) => includeDay(day, input));
  const trades = days.reduce((total, day) => total + day.trades, 0);
  const winCount = dayPacket.value.rows
    .filter((row) => days.some((day) => day.date === dayFromIdentity(row.groupIdentity)))
    .reduce((total, row) => total + (readMetric(row.metrics, "win_count") ?? 0), 0);
  const dates = days.map((day) => day.date).sort();
  const symbols = [...new Set(
    [...tickersByDay.values()].flatMap((tickers) => tickers.map((ticker) => ticker.symbol)),
  )].sort();
  const fallbackDate = input?.endDate ?? new Date().toISOString().slice(0, 10);
  return {
    activeDate: dates.at(-1) ?? fallbackDate,
    currency,
    days,
    maximumDate: dates.at(-1) ?? fallbackDate,
    minimumDate: dates[0] ?? fallbackDate,
    status: "ready",
    summary: {
      netPnl: days.reduce((total, day) => total + (day.pnl ?? 0), 0),
      tradingDays: days.length,
      trades,
      winRate: trades === 0 ? null : winCount / trades,
    },
    symbols,
  };
}
