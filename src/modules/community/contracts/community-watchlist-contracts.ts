export const COMMUNITY_PROFILE_TAGS = Object.freeze([
  "Day trader",
  "Swing trader",
  "Small caps",
  "Micro caps",
  "Nano caps",
  "Premarket",
  "After-hours",
  "Momentum",
  "Biotech",
  "New York session",
] as const);

export const COMMUNITY_WATCHLIST_TAGS = Object.freeze([
  "Small cap",
  "Micro cap",
  "Nano cap",
  "Low float",
  "Premarket",
  "After-hours",
  "Earnings",
  "News catalyst",
  "SEC filing",
  "Offering/dilution risk",
  "Reverse split",
  "Biotech",
  "Momentum",
  "Swing idea",
] as const);

export type CommunityTickerInput = Readonly<{
  symbol: string;
  tags?: readonly string[];
  whyWatching?: string;
  plan?: string;
  personalTarget?: string;
  catalyst?: string;
  catalystDate?: string | null;
}>;

export type CreateCommunityWatchlistInput = Readonly<{
  title: string;
  description?: string;
  profileTags?: readonly string[];
  tags?: readonly string[];
  tickers: readonly CommunityTickerInput[];
  publish: boolean;
  sendDiscord: boolean;
}>;

export type CommunityWatchlistTickerPreview = Readonly<{
  symbol: string;
  tags: readonly string[];
  whyWatching: string;
  plan: string;
  personalTarget: string;
  catalyst: string;
  catalystDate: string | null;
}>;

export type CommunityWatchlistSummary = Readonly<{
  authorHandle: string;
  description: string;
  href: string;
  status: "draft" | "published";
  symbolCount: number;
  symbols: readonly string[];
  tags: readonly string[];
  title: string;
  tickerPreviews: readonly CommunityWatchlistTickerPreview[];
}>;

export type CommunityWatchlistDetail = Readonly<{
  authorHandle: string;
  authorTags: readonly string[];
  description: string;
  publishedAtUtc: string;
  updatedAtUtc: string;
  symbolCount: number;
  tags: readonly string[];
  tickers: readonly Readonly<{
    symbol: string;
    tags: readonly string[];
    whyWatching: string;
    plan: string;
    personalTarget: string;
    catalyst: string;
    catalystDate: string | null;
    postedAtUtc: string;
  }>[];
  title: string;
}>;

export type CommunityProfile = Readonly<{
  handle: string;
  tags: readonly string[];
  watchlists: readonly CommunityWatchlistSummary[];
}>;
