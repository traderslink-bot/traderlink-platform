import "server-only";

import type {
  DailyTradeAnalyzedTradePage,
  DailyTradePatternOccurrencePage,
  DailyTradePatternOccurrenceRow,
} from "./daily-trade-analysis-evidence-service";
import {
  journalReportingCurrencyAmount,
  type JournalReportingCurrencyContext,
} from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";

function reportingResult(
  roundTripId: string,
  value: string | null,
  context: JournalReportingCurrencyContext,
): string | null {
  if (value === null) return null;
  const sourceCurrency = context.sourceCurrencyByRoundTrip.get(roundTripId);
  const sourceDate = context.sourceDateByRoundTrip.get(roundTripId);
  if (!sourceCurrency || !sourceDate) {
    throw new TypeError("Reporting conversion is unavailable for this trade.");
  }
  return journalReportingCurrencyAmount(
    value,
    sourceCurrency,
    context.reportingCurrency,
    sourceDate,
    context,
  );
}

export function reportDailyTradeAnalyzedTrades(
  page: DailyTradeAnalyzedTradePage,
  context: JournalReportingCurrencyContext,
): DailyTradeAnalyzedTradePage {
  return Object.freeze({
    ...page,
    rows: Object.freeze(page.rows.map((row) => Object.freeze({
      ...row,
      resultDecimal: reportingResult(row.roundTripId, row.resultDecimal, context),
    }))),
  });
}

export function reportDailyTradePatternOccurrence(
  row: DailyTradePatternOccurrenceRow,
  context: JournalReportingCurrencyContext,
): DailyTradePatternOccurrenceRow {
  return Object.freeze({
    ...row,
    currency: context.reportingCurrency,
    resultDecimal: reportingResult(row.roundTripId, row.resultDecimal, context),
  });
}

export function reportDailyTradePatternOccurrences(
  page: DailyTradePatternOccurrencePage,
  context: JournalReportingCurrencyContext,
): DailyTradePatternOccurrencePage {
  return Object.freeze({
    ...page,
    rows: Object.freeze(page.rows.map((row) =>
      reportDailyTradePatternOccurrence(row, context))),
  });
}
