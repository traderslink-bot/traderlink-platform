import type { LiveWatchlistMarketDataStatus, LiveWatchlistSymbolState } from "@/src/lib/live-watchlist/live-watchlist-types";

const priceTime = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  timeZone: "America/New_York",
});

export function watchlistPriceNote(symbol: Pick<LiveWatchlistSymbolState, "latestPriceSource" | "latestPriceObservedAt">, status: LiveWatchlistMarketDataStatus): string {
  if (status === "live") return "(delayed 15 sec)";
  // Never substitute publication, card refresh, or server startup time for a quote.
  const observedAt = symbol.latestPriceSource === "ticker" ? symbol.latestPriceObservedAt : null;
  return typeof observedAt === "number" && Number.isFinite(observedAt) && observedAt > 0
    ? `Not live · Last price: ${priceTime.format(observedAt)} ET`
    : "Not live · Price time unavailable";
}

export function WatchlistLiveDataStatus({ status }: { status: LiveWatchlistMarketDataStatus }) {
  const on = status === "live";
  const color = on ? "#15803d" : "#dc2626";
  return <span style={{ border: `1px solid ${color}` }}>Live data: <strong style={{ color }}>{on ? "On" : "Off"}</strong></span>;
}
