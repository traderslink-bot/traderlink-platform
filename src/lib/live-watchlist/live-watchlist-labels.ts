import type {
  LiveWatchlistMarketDataStatus,
  LiveWatchlistStatus,
} from "./live-watchlist-types";

export function formatMarketDataStatusLabel(status: LiveWatchlistMarketDataStatus): string {
  switch (status) {
    case "live":
      return "Live Data: ON";
    case "stale":
    case "offline":
    case "starting":
      return "Live Data: OFF";
    default:
      return "Live Data: OFF";
  }
}

export function formatTickerStatusLabel(status: LiveWatchlistStatus): string {
  switch (status) {
    case "live":
      return "Ticker Data: Live (slight delay)";
    case "stale":
    case "deactivated":
      return "Ticker Data: off";
    default:
      return "Ticker Data: off";
  }
}

export function formatTickerStatusTone(status: LiveWatchlistStatus): "live" | "off" {
  switch (status) {
    case "live":
      return "live";
    case "stale":
    case "deactivated":
      return "off";
    default:
      return "off";
  }
}
