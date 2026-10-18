import "server-only";
import calendar from "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { indicatorMarketDate, indicatorTradingDay } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import type { IndicatorCalendar } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import type { WatchlistSetupSession } from "@/src/lib/live-watchlist/setups/setup-contracts";
import { setupPublicationIdentity, watchlistMarketDataDemand, nextWatchlistSetupFeedAt } from "@/src/lib/live-watchlist/setups/setup-demand";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { watchlistSetupStore } from "./setup-store";
import { reconcileWatchlistIndicatorPopulation, refreshWatchlistIndicators } from "../indicators/indicator-refresh-runtime";

function sessionAt(now: number): WatchlistSetupSession | null {
  const day = indicatorTradingDay(calendar as IndicatorCalendar, indicatorMarketDate(now));
  return !day || now < day.preOpen || now >= day.postClose ? null
    : now < day.regularOpen ? "premarket" : now < day.regularClose ? "regular" : "postmarket";
}
async function configuration() {
  try { return await watchlistSetupStore().configuration(); }
  catch { return null; } // A setup-settings error must not disable existing Indicators.
}

/** Exact current publication/access recheck, also used immediately before transport. */
export async function watchlistFeedDemandFor(symbol: string, identity: string, now = Date.now()) {
  if (!setupPublicationIdentity.test(identity)) return null;
  const ticker = await new LiveWatchlistStore().getSymbol(symbol);
  if (!ticker || ticker.indicatorPublicationIdentity !== identity) return null;
  return watchlistMarketDataDemand(ticker, await configuration(), sessionAt(now));
}

/** Existing publisher and hosted setup scheduling converge on this same operation. */
export async function refreshPublishedWatchlistMarketData(symbol: string, identity: string) {
  const demand = await watchlistFeedDemandFor(symbol, identity);
  if (!demand) return null;
  return refreshWatchlistIndicators(symbol, identity, demand);
}

const status = { running: false, checkedAt: null as number | null, lastFailureAt: null as number | null,
  dueTickers: 0, completedTickers: 0 };
export function watchlistSetupFeedStatus() { return { ...status, cadence: "minute-close-plus-five-seconds", scope: "shared_watchlist_process" }; }

/** No provider calls on import. Only the existing hosted startup registers this. */
export async function runWatchlistSetupFeedOnce(now = Date.now()): Promise<void> {
  if (status.running) return;
  status.running = true; status.checkedAt = now; status.dueTickers = 0; status.completedTickers = 0;
  try {
    const config = await configuration(), session = sessionAt(now);
    if (!config?.settings.enabled || session === null) return;
    const population = await new LiveWatchlistStore().listSymbols();
    const active = population.symbols.map(ticker => ({ ticker, demand: watchlistMarketDataDemand(ticker, config, session) }))
      .filter(item => item.demand !== null);
    reconcileWatchlistIndicatorPopulation(new Map(active.map(({ ticker }) => [ticker.symbol, ticker.indicatorPublicationIdentity!])));
    const due = active.filter(item => item.demand?.reuseCompletedFrames).slice(0, 64);
    status.dueTickers = due.length;
    // Serial ticker warm-up is bounded; the transport coordinator handles page admission.
    // Recheck before each ticker so removal/disable while queued cannot start stale work.
    for (const { ticker } of due) {
      try { await refreshPublishedWatchlistMarketData(ticker.symbol, ticker.indicatorPublicationIdentity!); status.completedTickers++; }
      catch { status.lastFailureAt = Date.now(); }
    }
  } catch { status.lastFailureAt = Date.now(); }
  finally { status.running = false; }
}

const lifecycle = globalThis as typeof globalThis & { __watchlistSetupFeedStarted?: boolean };
export function startWatchlistSetupSharedFeed(): void {
  if (lifecycle.__watchlistSetupFeedStarted) return;
  lifecycle.__watchlistSetupFeedStarted = true;
  const next = () => {
    const now = Date.now();
    const target = nextWatchlistSetupFeedAt(now);
    const timer = setTimeout(() => { void runWatchlistSetupFeedOnce().finally(next); }, target - now);
    timer.unref?.();
  };
  // No catch-up loop after a pause, and no second app or independent provider fetcher.
  if (Date.now() % 60_000 < 5000) next();
  else void runWatchlistSetupFeedOnce().finally(next);
}
