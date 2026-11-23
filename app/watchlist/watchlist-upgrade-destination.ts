export const WATCHLIST_PREMIUM_URL = "https://whop.com/traderslink-1049/premium-access-2026/";

const FEATURES: Readonly<Record<string, string>> = {
  Ticker: "watchlist.ticker_details", "Ticker details": "watchlist.ticker_details",
  "Trade analysis": "watchlist.trade_analysis", "Trade analysis & preparation": "watchlist.trade_analysis",
  Levels: "watchlist.levels", "Support and Resistance": "watchlist.levels",
  "Indicator card": "watchlist.indicators", Watchlist: "watchlist.access",
};

/** Undefined is legacy; explicit null must never expose an unlisted offer. */
export function watchlistUpgradeDestination(href: string | null | undefined, feature: string, premium: boolean) {
  return href === undefined ? premium ? WATCHLIST_PREMIUM_URL : `/plans?feature=${FEATURES[feature] ?? "watchlist.access"}` : href;
}

export function watchlistUpgradeLinkProps(href: string) {
  return /^https:\/\/whop\.com\//i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } as const : {};
}
