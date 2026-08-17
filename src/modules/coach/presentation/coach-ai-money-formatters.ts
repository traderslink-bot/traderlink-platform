import {
  formatJournalAnalyticsDecimal,
  journalAnalyticsCurrencySymbol,
} from
  "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

const SYMBOL_PREFIXED_MONEY = /([+-]?\s*[$€£¥]\s*[+-]?\s*)(\d[\d,]*\.\d{3,})/gu;
const CODE_PREFIXED_MONEY = /\b([A-Z]{3})\s+([+-]?)\s*(\d[\d,]*(?:\.\d+)?)/gu;
const CODE_SUFFIXED_MONEY = /(?<![\w.])([+-]?)(\d[\d,]*(?:\.\d+)?)\s+([A-Z]{3})\b/gu;

function formatMoneyDecimal(value: string): string {
  return formatJournalAnalyticsDecimal(value.replaceAll(",", ""), 2);
}

function formatCodePrefixedMoney(
  original: string,
  currency: string,
  sign: string,
  amount: string,
): string {
  const symbol = journalAnalyticsCurrencySymbol(currency);
  return symbol === null
    ? original
    : `${sign}${symbol}${formatMoneyDecimal(amount)}`;
}

/**
 * Applies the dashboard's money-only display precision rule to AI narrative.
 * Stored provider output and non-money numbers remain unchanged.
 */
export function formatCoachAiMoneyForDisplay(value: string): string {
  return value
    .replace(SYMBOL_PREFIXED_MONEY, (_match, prefix: string, amount: string) =>
      `${prefix}${formatMoneyDecimal(amount)}`)
    .replace(CODE_PREFIXED_MONEY, (match, currency: string, sign: string, amount: string) =>
      formatCodePrefixedMoney(match, currency, sign, amount))
    .replace(CODE_SUFFIXED_MONEY, (match, sign: string, amount: string, currency: string) =>
      formatCodePrefixedMoney(match, currency, sign, amount));
}
