import type { JournalAnalyticsExactValue } from
  "../contracts/analytics-result";

export type FinancialOutcomeColor =
  | "success.main"
  | "error.main"
  | "text.primary";

const FINANCIAL_OUTCOME_METRIC_IDS = new Set([
  "selected_pnl",
  "net_pnl",
  "gross_pnl",
  "average_pnl",
  "median_pnl",
  "best_trade",
  "worst_trade",
  "expectancy",
  "average_winning_trade",
  "average_losing_trade",
  "return_on_entry_notional",
  "average_daily_pnl",
  "best_trading_day",
  "worst_trading_day",
]);

function decimalSign(value: string): -1 | 0 | 1 {
  const trimmed = value.trim();
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/u.test(trimmed)) return 0;
  const magnitude = trimmed.replace(/^-/, "").replace(".", "");
  if (!/[1-9]/u.test(magnitude)) return 0;
  return trimmed.startsWith("-") ? -1 : 1;
}

function outcomeSign(
  value: JournalAnalyticsExactValue | number | string | null | undefined,
): -1 | 0 | 1 {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return 0;
    return value < 0 ? -1 : 1;
  }
  if (typeof value === "string") return decimalSign(value);
  if (value.kind === "integer") return outcomeSign(value.value);
  if (value.kind === "decimal") return decimalSign(value.valueDecimal);
  if (value.kind === "rational") return decimalSign(value.numeratorDecimal);
  return 0;
}

export function financialOutcomeColor(
  value: JournalAnalyticsExactValue | number | string | null | undefined,
): FinancialOutcomeColor {
  const sign = outcomeSign(value);
  return sign < 0
    ? "error.main"
    : sign > 0
      ? "success.main"
      : "text.primary";
}

export function financialOutcomeMetricColor(
  metricId: string,
  value: JournalAnalyticsExactValue | null | undefined,
): FinancialOutcomeColor {
  return FINANCIAL_OUTCOME_METRIC_IDS.has(metricId)
    ? financialOutcomeColor(value)
    : "text.primary";
}

function numericOutcomeValue(
  value: JournalAnalyticsExactValue | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    return /^-?(?:\d+(?:\.\d*)?|\.\d+)$/u.test(value.trim()) ? Number(value) : null;
  }
  if (value.kind === "integer") return value.value;
  if (value.kind === "decimal") return Number(value.valueDecimal);
  if (value.kind === "rational") {
    const denominator = Number(value.denominatorInteger);
    return Number.isFinite(denominator) && denominator !== 0
      ? Number(value.numeratorDecimal) / denominator
      : null;
  }
  return null;
}

export function financialThresholdColor(
  value: JournalAnalyticsExactValue | number | string | null | undefined,
  threshold: number,
): FinancialOutcomeColor {
  const numericValue = numericOutcomeValue(value);
  if (numericValue === null || !Number.isFinite(numericValue) || !Number.isFinite(threshold) || numericValue === threshold) {
    return "text.primary";
  }
  return numericValue > threshold ? "success.main" : "error.main";
}

export function financialSummaryMetricColor(
  metricId: string,
  value: JournalAnalyticsExactValue | null | undefined,
): FinancialOutcomeColor {
  if (metricId === "win_rate") return financialThresholdColor(value, 50);
  if (metricId === "profit_factor") return financialThresholdColor(value, 1);
  return financialOutcomeMetricColor(metricId, value);
}
