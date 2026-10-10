export const MEMBERSHIP_PRIVATE_WATCHLIST_FEATURES = Object.freeze([
  { key: "watchlist.levels", label: "Watchlist support, resistance & full ladder", kind: "boolean", module: "watchlist" },
  { key: "private_watchlist.access", label: "Private Watchlist", kind: "boolean", module: "watchlist" },
  { key: "private_watchlist.analysis", label: "Private Watchlist analysis", kind: "boolean", module: "watchlist" },
  { key: "private_watchlist.indicators", label: "Private Watchlist indicators", kind: "boolean", module: "watchlist" },
  { key: "private_watchlist.levels", label: "Private Watchlist levels", kind: "boolean", module: "watchlist" },
  { key: "private_watchlist.ticker_additions", label: "Private Watchlist ticker additions", kind: "limit", module: "watchlist" },
  { key: "private_watchlist.active_tickers", label: "Private Watchlist active tickers", kind: "limit", module: "watchlist" },
  { key: "private_watchlist.generations", label: "Private Watchlist generations", kind: "limit", module: "watchlist" },
  { key: "private_watchlist.cost_microusd", label: "Private Watchlist generation budget", kind: "limit", module: "watchlist" },
] as const);

export type PrivateWatchlistMeter = "ticker_additions" | "generations" | "cost_microusd";
export type PrivateWatchlistPeriod = Readonly<{ kind: "calendar_month" | "days" | "lifetime"; days: number | null }>;

export function formatPrivateWatchlistPeriod(period: PrivateWatchlistPeriod): string {
  return period.kind === "calendar_month" ? "Calendar month (UTC)" : period.kind === "lifetime"
    ? "No reset" : `Every ${period.days} ${period.days === 1 ? "day" : "days"}`;
}

/** UTC calendar months are real months, not fixed thirty-day intervals. */
export function privateWatchlistPeriodStart(period: PrivateWatchlistPeriod, anchorUtc: string, nowUtc: string): string {
  const now = Date.parse(nowUtc);
  const anchor = Date.parse(anchorUtc);
  if (!Number.isFinite(now) || !Number.isFinite(anchor)) throw new Error("Invalid Watchlist allowance period.");
  if (period.kind === "lifetime") return "0001-01-01T00:00:00.000Z";
  if (period.kind === "calendar_month") {
    const date = new Date(now);
    date.setUTCDate(1); date.setUTCHours(0, 0, 0, 0);
    return date.toISOString();
  }
  if (!Number.isSafeInteger(period.days) || period.days === null || period.days < 1) throw new Error("Invalid Watchlist allowance period.");
  const duration = BigInt(period.days) * BigInt(86_400_000);
  const elapsed = BigInt(Math.max(0, now - anchor));
  return new Date(Number(BigInt(anchor) + (elapsed / duration) * duration)).toISOString();
}
