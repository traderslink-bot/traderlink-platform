export const MARKET_DATA_FEATURES = ["scanners", "screeners", "charts", "trade-analyzer", "watchlist"] as const;
export type MarketDataFeature = typeof MARKET_DATA_FEATURES[number];
export type MarketDataProvider = "alpaca" | "moomoo";
export const MARKET_DATA_FEATURE_LABELS: Record<MarketDataFeature, string> = {
  scanners: "Scanners", screeners: "Screeners", charts: "Charts", "trade-analyzer": "Trade Analyzer", watchlist: "Watchlist",
};
export type MarketDataControl = { feature: MarketDataFeature; provider: MarketDataProvider | "custom"; revision: number; available: boolean; synchronized?: boolean };
