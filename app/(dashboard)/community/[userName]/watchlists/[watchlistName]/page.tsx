import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import {
  formatFinnhubMarketCap,
  getFinnhubCompanyProfile,
} from "@/src/lib/news/finnhub-company-profile";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage } from "../../../../../dashboard-template";
import {
  CommunityWatchlistCard,
  type CommunityTickerCompanyFacts,
} from "../../../watchlists/community-watchlist-cards";

export const metadata: Metadata = {
  title: "Community watchlist | TradersLink Platform",
};

export default async function CommunityWatchlistDetailPage({
  params,
}: {
  params: Promise<{ userName: string; watchlistName: string }>;
}) {
  const { userName, watchlistName } = await params;
  const scope = await requireTraderLinkPlatformPageScope();
  const detail = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).findPublished(userName, watchlistName),
  );
  if (!detail) notFound();
  const editable = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).ownsPublished(scope.userId, userName, watchlistName),
  );
  const tickerFacts = Object.fromEntries(await Promise.all(detail.tickers.map(async (ticker) => {
    const profile = await getFinnhubCompanyProfile(ticker.symbol);
    const facts: CommunityTickerCompanyFacts | null = profile ? {
      country: profile.country,
      industry: profile.industry,
      marketCap: formatFinnhubMarketCap(profile.marketCapitalization),
      sharesOutstanding: formatFinnhubMarketCap(profile.shareOutstanding),
    } : null;
    return [ticker.symbol, facts];
  })));
  return (
    <DashboardPage>
      <Stack spacing={1.75} sx={{ maxWidth: 790 }}>
        <CommunityWatchlistCard detail={detail} editable={editable} tickerFacts={tickerFacts} watchlistSlug={watchlistName} />
      </Stack>
    </DashboardPage>
  );
}
