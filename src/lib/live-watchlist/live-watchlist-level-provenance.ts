import type { LiveWatchlistLevelMapLevel } from "./live-watchlist-types";

const marketDataDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

function formatMarketDataDate(value: number | undefined): string | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? marketDataDateFormatter.format(new Date(value))
    : null;
}

export function formatLevelMarketDataProvenance(
  level: LiveWatchlistLevelMapLevel,
): string | null {
  const provenance = level.marketDataProvenance;
  if (!provenance) {
    return null;
  }

  const formed = formatMarketDataDate(provenance.formedAt);
  const tested = formatMarketDataDate(provenance.lastTestedAt);
  const confirmed = formatMarketDataDate(provenance.lastConfirmedAt);
  if (!formed) {
    return null;
  }
  if (
    confirmed &&
    tested &&
    provenance.lastConfirmedAt !== undefined &&
    provenance.lastTestedAt !== undefined &&
    provenance.lastTestedAt > provenance.lastConfirmedAt
  ) {
    return `Confirmed ${confirmed} · Tested ${tested}`;
  }
  if (confirmed) {
    return `Formed ${formed} · Confirmed ${confirmed}`;
  }
  if (tested) {
    return `Formed ${formed} · Tested ${tested}`;
  }
  return `Formed ${formed}`;
}
