import type { Metadata } from "next";

import { DashboardPage } from "../../../../dashboard-template";
import {
  CommunityWatchlistCard,
} from "../community-watchlist-cards";
import type { CommunityTickerCompanyFacts } from "@/src/modules/community/contracts/community-watchlist-contracts";
import type { CommunityWatchlistDetail } from "@/src/modules/community/contracts/community-watchlist-contracts";

export const metadata: Metadata = {
  title: "Watchlist card preview | TradersLink Platform",
};

const detail: CommunityWatchlistDetail = {
  authorHandle: "traderslink-c6c05d",
  authorDisplayName: "traderslink",
  authorDescription: "Small-cap trader focused on momentum and catalyst setups.",
  slug: "penny-plays",
  authorTags: ["Premarket", "Small caps"],
  description: "Welcome to my watchlist! I maintain this list on a regular basis. Typically the stocks I pick are under 50m float. I enter trades on momentum and do not hold penny stocks very long.",
  publishedAtUtc: "2026-08-23T20:00:00.000Z",
  status: "published",
  updatedAtUtc: "2026-08-23T20:00:00.000Z",
  symbolCount: 5,
  tags: ["After-hours", "Earnings", "Nano cap", "News catalyst"],
  tickers: [
    { symbol: "WBUY", tags: ["Nano cap", "Premarket"], whyWatching: "Momentum setup with news interest.", plan: "Wait for clean volume and confirmation.", personalTarget: "", catalyst: "", catalystDate: null, postedAtUtc: "2026-08-23T20:00:00.000Z" },
    { symbol: "DXST", tags: ["Small cap"], whyWatching: "Watching for relative volume.", plan: "", personalTarget: "", catalyst: "", catalystDate: null, postedAtUtc: "2026-08-23T20:00:00.000Z" },
    { symbol: "INCR", tags: ["Earnings"], whyWatching: "", plan: "", personalTarget: "", catalyst: "", catalystDate: null, postedAtUtc: "2026-08-23T20:00:00.000Z" },
    { symbol: "AAOZ", tags: ["News catalyst"], whyWatching: "", plan: "", personalTarget: "", catalyst: "", catalystDate: null, postedAtUtc: "2026-08-23T20:00:00.000Z" },
    { symbol: "PLAG", tags: ["Premarket"], whyWatching: "", plan: "", personalTarget: "", catalyst: "", catalystDate: null, postedAtUtc: "2026-08-23T20:00:00.000Z" },
  ],
  title: "Penny Plays",
};

const tickerFacts: Readonly<Record<string, CommunityTickerCompanyFacts | null>> = {
  WBUY: { country: "KY", industry: "Retail", marketCap: "5.65M", sharesOutstanding: "5.48M" },
  DXST: { country: "CN", industry: "Commercial Services & Supplies", marketCap: "4.57M", sharesOutstanding: "1.82M" },
  INCR: { country: "IL", industry: "Pharmaceuticals", marketCap: "152.75M", sharesOutstanding: "59.23M" },
  AAOZ: null,
  PLAG: { country: "US", industry: "Food Products", marketCap: "9.74M", sharesOutstanding: "14.23M" },
};

export default function CommunityWatchlistCardPreviewPage() {
  return <DashboardPage><CommunityWatchlistCard detail={detail} editable={false} initiallyFollowing={false} tickerFacts={tickerFacts} watchlistSlug="penny-plays" /></DashboardPage>;
}
