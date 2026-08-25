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

export type CommunityTickerCompanyFacts = Readonly<{
  country: string | null;
  industry: string | null;
  marketCap: string | null;
  sharesOutstanding: string | null;
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
  authorDisplayName: string;
  authorDescription: string;
  authorTags: readonly string[];
  description: string;
  publishedAtUtc: string | null;
  slug: string;
  status: "draft" | "published";
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
  displayName: string;
  description: string;
  tags: readonly string[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  followers: readonly CommunityProfileConnection[];
  following: readonly CommunityProfileConnection[];
  watchlists: readonly CommunityWatchlistSummary[];
}>;

export type CommunityProfileConnection = Readonly<{
  handle: string;
  displayName: string;
}>;

export type CommunityProfileSettings = Readonly<{
  handle: string | null;
  discordUsername: string;
  description: string;
  tags: readonly string[];
  visible: boolean;
  followerCount: number;
  followingCount: number;
}>;
