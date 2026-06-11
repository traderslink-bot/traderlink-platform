import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";
import { buildTraderAnalyticsReport } from "../build-trader-analytics-report";
import type { SavedExecutionTrade, SavedTraderAnalyticsReport } from "./types";

export function isLocalSyntheticTicker(
  symbol: string | null | undefined,
): boolean {
  return /^E2E\d{6,}$/i.test(String(symbol ?? ""));
}

export function isLocalSyntheticTrade(trade: SavedExecutionTrade): boolean {
  return isLocalSyntheticTicker(trade.symbol);
}

export function filterCustomerSavedTrades(
  trades: SavedExecutionTrade[],
): SavedExecutionTrade[] {
  return trades.filter((trade) => !isLocalSyntheticTrade(trade));
}

export function filterCustomerSavedReports(
  reports: SavedTraderAnalyticsReport[],
): SavedTraderAnalyticsReport[] {
  return reports
    .map(filterCustomerSavedReport)
    .filter((report): report is SavedTraderAnalyticsReport => report !== null);
}

function filterCustomerSavedReport(
  report: SavedTraderAnalyticsReport,
): SavedTraderAnalyticsReport | null {
  const sourceSummaries = report.sourceSummaries
    .filter((summaryRef) => !isLocalSyntheticTicker(summaryRef.summary.symbol))
    .map((summaryRef, requestIndex) => ({
      ...summaryRef,
      requestIndex,
    }));

  if (sourceSummaries.length === 0) {
    return null;
  }

  if (sourceSummaries.length === report.sourceSummaries.length) {
    return report;
  }

  const rebuiltReport = buildTraderAnalyticsReport({
    generatedAt: report.generatedAt,
    inputMode: "execution_feedback_summaries",
    requestCount: sourceSummaries.length,
    source: report.report.source,
    summaries: sourceSummaries.map((summaryRef, requestIndex) => ({
      requestIndex,
      summary: summaryRef.summary as ExecutionFeedbackSummary,
    })),
  });

  return {
    ...report,
    report: rebuiltReport,
    sourceSummaries,
    sourceTradeIds: sourceSummaries.map((summaryRef) => summaryRef.tradeId),
  };
}
