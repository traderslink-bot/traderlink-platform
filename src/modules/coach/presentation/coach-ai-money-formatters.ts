import { formatJournalAnalyticsDecimal } from
  "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

const SYMBOL_PREFIXED_MONEY = /([+-]?\s*[$€£¥]\s*[+-]?\s*)(\d[\d,]*\.\d{3,})/gu;
const CODE_PREFIXED_MONEY = /\b([A-Z]{3}\s+[+-]?\s*)(\d[\d,]*\.\d{3,})/gu;
const CODE_SUFFIXED_MONEY = /(?<![\w.])([+-]?\d[\d,]*\.\d{3,})(\s+[A-Z]{3}\b)/gu;

function formatMoneyDecimal(value: string): string {
  return formatJournalAnalyticsDecimal(value.replaceAll(",", ""), 2);
}

/**
 * Applies the dashboard's money-only display precision rule to AI narrative.
 * Stored provider output and non-money numbers remain unchanged.
 */
export function formatCoachAiMoneyForDisplay(value: string): string {
  return value
    .replace(SYMBOL_PREFIXED_MONEY, (_match, prefix: string, amount: string) =>
      `${prefix}${formatMoneyDecimal(amount)}`)
    .replace(CODE_PREFIXED_MONEY, (_match, prefix: string, amount: string) =>
      `${prefix}${formatMoneyDecimal(amount)}`)
    .replace(CODE_SUFFIXED_MONEY, (_match, amount: string, suffix: string) =>
      `${formatMoneyDecimal(amount)}${suffix}`);
}
