export type SavedTradePeriod = Readonly<{ startDate: string | null; endDate: string | null }>;

/** Apply only after complete saved-trade membership has been resolved. */
export function savedTradeClosesInPeriod(closeLocalDate: string, period?: SavedTradePeriod): boolean {
  return (!period?.startDate || closeLocalDate >= period.startDate) &&
    (!period?.endDate || closeLocalDate <= period.endDate);
}
