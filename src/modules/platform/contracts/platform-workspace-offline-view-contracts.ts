import type { JournalCalendarReadModel } from "@/src/modules/journal-analytics/contracts/journal-dashboard-read-models";

import type { PlatformOfflineCoverageFact } from "./platform-offline-saved-view-contracts";

export const PLATFORM_WORKSPACE_OFFLINE_ROUTE_VIEW_VERSION =
  "platform-workspace-v1" as const;
export const PLATFORM_WORKSPACE_OFFLINE_VIEW_KEY =
  "platform:workspace:all-available-history" as const;

export type PlatformWorkspaceOfflineMetric = Readonly<{
  caption: string;
  label: string;
  value: string;
}>;

type PlatformWorkspaceOfflineRuleOutcome = Readonly<{
  ruleId: string;
  ruleTitle: string;
  status: "followed" | "broken";
}>;

export type PlatformWorkspaceOfflineReviewSummary = Readonly<{
  currentFocuses: string | null;
  focusRules: readonly Readonly<{
    reviewScope: "day" | "trade" | "both";
    ruleId: string;
    statement: string;
    title: string;
  }>[];
  previousReview: Readonly<{
    currency: string | null;
    date: string;
    dayRuleOutcomes: readonly PlatformWorkspaceOfflineRuleOutcome[];
    netPnlDecimal: string | null;
    tradeCount: number;
    trades: readonly Readonly<{
      direction: "long" | "short";
      netPnlDecimal: string | null;
      roundTripId: string;
      ruleOutcomes: readonly PlatformWorkspaceOfflineRuleOutcome[];
      symbol: string;
    }>[];
  }> | null;
}>;

export type PlatformWorkspaceOfflineViewModel = Readonly<{
  analyticsMetrics: readonly PlatformWorkspaceOfflineMetric[];
  calendarData: JournalCalendarReadModel;
  reviewSummary: PlatformWorkspaceOfflineReviewSummary;
  version: 1;
}>;

function weekStart(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}

function currentWorkspaceWeek(calendar: JournalCalendarReadModel): JournalCalendarReadModel {
  const startDate = weekStart(calendar.activeDate);
  const end = new Date(`${startDate}T12:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 4);
  const endDate = end.toISOString().slice(0, 10);
  return Object.freeze({
    ...calendar,
    days: Object.freeze(calendar.days.filter((day) =>
      day.date >= startDate && day.date <= endDate)),
  });
}

export function createPlatformWorkspaceOfflineViewModel(input: Readonly<{
  analyticsMetrics: readonly PlatformWorkspaceOfflineMetric[];
  calendarData: JournalCalendarReadModel;
  reviewSummary: PlatformWorkspaceOfflineReviewSummary;
}>): PlatformWorkspaceOfflineViewModel {
  return Object.freeze({
    analyticsMetrics: Object.freeze(input.analyticsMetrics.map((metric) =>
      Object.freeze({ ...metric }))),
    calendarData: currentWorkspaceWeek(input.calendarData),
    reviewSummary: input.reviewSummary,
    version: 1,
  });
}

export function platformWorkspaceOfflineCoverage(
  model: PlatformWorkspaceOfflineViewModel,
): readonly PlatformOfflineCoverageFact[] {
  const metricsAvailable = model.analyticsMetrics.some((metric) =>
    metric.value !== "N/A" && metric.value !== "—");
  const calendarAvailable = model.calendarData.state !== "unavailable";
  return Object.freeze([
    Object.freeze({
      key: "workspace_metrics",
      label: "Workspace performance",
      reason: metricsAvailable
        ? null
        : "Verified performance values were not available for the selected Trade Tracker account.",
      status: metricsAvailable ? "available" : "unavailable",
    }),
    Object.freeze({
      key: "workspace_calendar",
      label: "Trading Calendar",
      reason: calendarAvailable
        ? null
        : "Verified trading-day information was not available for the selected Trade Tracker account.",
      status: calendarAvailable ? "available" : "unavailable",
    }),
    Object.freeze({
      key: "workspace_review",
      label: "Trading review",
      reason: null,
      status: "available",
    }),
  ]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isRuleOutcome(value: unknown): value is PlatformWorkspaceOfflineRuleOutcome {
  return isRecord(value) &&
    typeof value.ruleId === "string" &&
    typeof value.ruleTitle === "string" &&
    (value.status === "followed" || value.status === "broken");
}

function isReviewSummary(value: unknown): value is PlatformWorkspaceOfflineReviewSummary {
  if (
    !isRecord(value) ||
    !isNullableString(value.currentFocuses) ||
    !Array.isArray(value.focusRules) ||
    value.focusRules.length > 100 ||
    !value.focusRules.every((rule) => isRecord(rule) &&
      typeof rule.ruleId === "string" &&
      typeof rule.title === "string" &&
      typeof rule.statement === "string" &&
      (rule.reviewScope === "day" || rule.reviewScope === "trade" ||
        rule.reviewScope === "both"))
  ) {
    return false;
  }
  if (value.previousReview === null) return true;
  const review = value.previousReview;
  return isRecord(review) &&
    typeof review.date === "string" &&
    isNullableString(review.currency) &&
    isNullableString(review.netPnlDecimal) &&
    typeof review.tradeCount === "number" &&
    Number.isSafeInteger(review.tradeCount) &&
    review.tradeCount >= 0 &&
    Array.isArray(review.dayRuleOutcomes) &&
    review.dayRuleOutcomes.length <= 100 &&
    review.dayRuleOutcomes.every(isRuleOutcome) &&
    Array.isArray(review.trades) &&
    review.trades.length <= 500 &&
    review.trades.every((trade) => isRecord(trade) &&
      typeof trade.roundTripId === "string" &&
      typeof trade.symbol === "string" &&
      (trade.direction === "long" || trade.direction === "short") &&
      isNullableString(trade.netPnlDecimal) &&
      Array.isArray(trade.ruleOutcomes) &&
      trade.ruleOutcomes.length <= 100 &&
      trade.ruleOutcomes.every(isRuleOutcome));
}

function isCalendarData(value: unknown): value is JournalCalendarReadModel {
  if (
    !isRecord(value) ||
    (value.state !== "ready" && value.state !== "empty" &&
      value.state !== "unavailable") ||
    !isNullableString(value.currency) ||
    !isNullableString(value.timezone) ||
    typeof value.activeDate !== "string" ||
    !Array.isArray(value.days) ||
    value.days.length > 5
  ) {
    return false;
  }
  return value.days.every((day) => isRecord(day) &&
    typeof day.date === "string" &&
    isNullableString(day.pnlDecimal) &&
    (day.pnlSign === -1 || day.pnlSign === 0 || day.pnlSign === 1 ||
      day.pnlSign === null) &&
    typeof day.tradeCount === "number" &&
    Number.isSafeInteger(day.tradeCount) &&
    day.tradeCount >= 0 &&
    isNullableString(day.winRatePercentDecimal) &&
    Array.isArray(day.tickers) &&
    day.tickers.length <= 500 &&
    day.tickers.every((ticker) => isRecord(ticker) &&
      typeof ticker.instrumentId === "string" &&
      typeof ticker.symbol === "string" &&
      isNullableString(ticker.pnlDecimal) &&
      (ticker.pnlSign === -1 || ticker.pnlSign === 0 || ticker.pnlSign === 1 ||
        ticker.pnlSign === null) &&
      typeof ticker.noteCount === "number" &&
      typeof ticker.ruleReviewCount === "number" &&
      typeof ticker.tagCount === "number"));
}

export function isPlatformWorkspaceOfflineViewModel(
  value: unknown,
): value is PlatformWorkspaceOfflineViewModel {
  return isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.analyticsMetrics) &&
    value.analyticsMetrics.length > 0 &&
    value.analyticsMetrics.length <= 12 &&
    value.analyticsMetrics.every((metric) => isRecord(metric) &&
      typeof metric.caption === "string" &&
      typeof metric.label === "string" &&
      typeof metric.value === "string") &&
    isCalendarData(value.calendarData) &&
    isReviewSummary(value.reviewSummary);
}
