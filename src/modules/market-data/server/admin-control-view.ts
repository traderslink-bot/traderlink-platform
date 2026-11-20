import "server-only";
import { MARKET_DATA_FEATURE_LABELS, type MarketDataAdminControl, type MarketDataControl } from "../provider-contract";

/** Only the authenticated admin endpoint supplies supplier labels and choices. */
export function adminControlView(row: MarketDataControl): MarketDataAdminControl {
  const previous = row.feature === "watchlist";
  return { ...row, controls: {
    selectedLabel: row.provider === "alpaca" ? "Alpaca" : row.provider === "custom" ? "Custom setup" : previous ? "Previous setup" : "Moomoo",
    primary: { provider: "alpaca", label: "Use Alpaca" },
    alternate: { provider: "moomoo", checked: row.provider === "moomoo",
      label: previous ? "Use previous setup" : "Use Moomoo",
      ariaLabel: previous ? "Use previous Watchlist setup" : "Use Moomoo for " + MARKET_DATA_FEATURE_LABELS[row.feature] },
    repair: row.provider === "custom" || row.synchronized === false
      ? { provider: row.provider === "moomoo" ? "moomoo" : "alpaca", label: row.synchronized === false ? "Complete switch" : "Use Alpaca" } : null,
    ...(previous ? { description: row.available
      ? "Previous setup uses EODHD history and live prices, with Moomoo same-day candles."
      : "Watchlist runtime settings are currently unavailable." } : {}),
  } };
}
