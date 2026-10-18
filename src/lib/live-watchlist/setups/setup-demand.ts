import type { IndicatorTimeframe } from "../indicators/indicator-engine";
import type { SetupConfiguration, WatchlistSetupSession } from "./setup-contracts";

export type WatchlistMarketDataDemand = Readonly<{
  frames: readonly IndicatorTimeframe[];
  minimumIntervalMs: number;
  reuseCompletedFrames: boolean;
}>;
export const setupPublicationIdentity = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export function nextWatchlistSetupFeedAt(now: number): number {
  const boundary = Math.floor(now / 60_000) * 60_000 + 5000;
  return boundary > now ? boundary : boundary + 60_000;
}

/** Pure demand union: hiding Indicators does not disable enabled setup detection. */
export function watchlistMarketDataDemand(ticker: Readonly<{
  status: string; firstPostedAt?: number | null; indicatorPublicationIdentity?: string; indicatorCardVisible?: boolean;
  watchlistGroup?: string;
}>, configuration: SetupConfiguration | null, session: WatchlistSetupSession | null): WatchlistMarketDataDemand | null {
  const identity = ticker.indicatorPublicationIdentity;
  if (ticker.status === "deactivated" || ticker.watchlistGroup === "private" || !Number.isSafeInteger(ticker.firstPostedAt) || !ticker.firstPostedAt
    || ticker.firstPostedAt <= 0 || !identity || !setupPublicationIdentity.test(identity)) return null;
  const setups = configuration !== null && configuration.settings.enabled && configuration.settings.enabledDetectors.length > 0
    && configuration.tickerOverrides[identity] !== false && session !== null && configuration.settings.sessions.includes(session);
  const indicators = ticker.indicatorCardVisible !== false;
  if (!setups && !indicators) return null;
  return { frames: indicators ? ["1m", "5m", "15m", "1d"] : ["1m", "5m"],
    minimumIntervalMs: setups ? 60_000 : 120_000, reuseCompletedFrames: setups };
}
