export type LiveWatchlistCardKind =
  | "companyInfo"
  | "fullLadder"
  | "nearestSupportResistance"
  | "liveTraderRead"
  | "marketStructure"
  | "recentNewsFilings";

export type LiveWatchlistStatus = "live" | "stale" | "deactivated";
export type LiveWatchlistMarketDataStatus = "live" | "stale" | "offline" | "starting";

export type LiveWatchlistCardContent = {
  title: string;
  body: string;
  updatedAt: number;
  priceWhenPosted: number | null;
  source: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type LiveWatchlistCardPatch = {
  symbol: string;
  status?: LiveWatchlistStatus;
  updatedAt: number;
  cards: Partial<Record<LiveWatchlistCardKind, LiveWatchlistCardContent | null>>;
};

export type LiveWatchlistHealthPatch = {
  type: "health";
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number;
};

export type LiveWatchlistTickerDataPatch = {
  type: "tickerData";
  symbol: string;
  status?: LiveWatchlistStatus;
  updatedAt: number;
  latestPrice: number;
  nearestSupport: number | null;
  nearestResistance: number | null;
  nearestSupportLabel?: string | null;
  nearestResistanceLabel?: string | null;
};

export type LiveWatchlistSymbolState = {
  symbol: string;
  status: LiveWatchlistStatus;
  updatedAt: number;
  firstPostedAt: number | null;
  companyName: string | null;
  latestPrice: number | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
  nearestSupportLabel?: string | null;
  nearestResistanceLabel?: string | null;
  latestTraderReadHeadline: string | null;
  cards: Partial<Record<LiveWatchlistCardKind, LiveWatchlistCardContent>>;
};

export type LiveWatchlistArchiveSnapshot = {
  archiveId: string;
  symbol: string;
  archivedAt: number;
  firstPostedAt: number | null;
  lastActiveUpdatedAt: number;
  state: LiveWatchlistSymbolState;
};

export type LiveWatchlistStatePayload = {
  generatedAt: number;
  marketDataStatus: LiveWatchlistMarketDataStatus;
  marketDataUpdatedAt: number | null;
  symbols: LiveWatchlistSymbolState[];
};
