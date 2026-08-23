import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import {
  formatFinnhubMarketCap,
  getFinnhubCompanyProfile,
} from "@/src/lib/news/finnhub-company-profile";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage, DashboardSecondaryAction } from "../../../../../dashboard-template";
import {
  CommunityWatchlistTickerBoard,
  type CommunityTickerCompanyFacts,
} from "../../../watchlists/community-watchlist-cards";

export const metadata: Metadata = {
  title: "Community watchlist | TradersLink Platform",
};

function avatarLetters(handle: string): string {
  return handle.replace(/[^a-z0-9]/giu, "").slice(0, 2).toUpperCase() || "TL";
}

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
        <Paper elevation={0} sx={{ border: 0, borderRadius: 2.5, overflow: "hidden" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" } }}>
            <Stack spacing={1.5} sx={{ minWidth: 0, p: { xs: 1.75, sm: 2.25 } }}>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
                  <Typography component="h1" variant="h1">{detail.title}</Typography>
                  <Chip label={`${detail.symbolCount} ${detail.symbolCount === 1 ? "symbol" : "symbols"}`} size="small" sx={{ bgcolor: "#edf3ff", color: "#082b73", fontWeight: 800 }} />
                </Stack>
                {detail.description ? <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{detail.description}</Typography> : null}
              </Box>
              {detail.tags.length ? <Box sx={{ pt: 0.35 }}>
                <Typography color="text.secondary" sx={{ fontWeight: 850 }} variant="caption">Watchlist tags</Typography>
                <Stack direction="row" spacing={0.65} sx={{ flexWrap: "wrap", mt: 0.65, rowGap: 0.65 }}>
                  {detail.tags.map((tag, index) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: index % 2 ? "#e9f7ef" : "#edf3ff", color: index % 2 ? "#14663c" : "#082b73", fontWeight: 700 }} />)}
                </Stack>
              </Box> : null}
            </Stack>
            <Stack sx={{ alignItems: "center", boxShadow: "inset 3px 0 0 #082b73", minHeight: { lg: 112 }, p: { xs: 1.5, sm: 1.75 } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", width: "100%" }}>
                <Stack spacing={0.35} sx={{ alignItems: "center", flex: "0 0 62px" }}>
                  <Avatar sx={{ bgcolor: "#102b69", fontWeight: 850, height: 48, width: 48 }}>{avatarLetters(detail.authorHandle)}</Avatar>
                  <Typography color="text.secondary" sx={{ fontSize: "0.63rem", fontWeight: 800, lineHeight: 1 }}>Trader</Typography>
                </Stack>
                <Stack spacing={0.7} sx={{ alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: "0.94rem", fontWeight: 850, lineHeight: 1.2 }}>@{detail.authorHandle}</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "0.7rem", lineHeight: 1.2, mt: 0.35 }}>Community watchlist owner</Typography>
                  </Box>
                  {detail.authorTags.length ? <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                    {detail.authorTags.map((tag) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#e7f6ed", color: "#14663c", fontWeight: 700 }} />)}
                  </Stack> : null}
                  <Box><Link href={`/community/${detail.authorHandle}`} style={{ textDecoration: "none" }}><DashboardSecondaryAction component="span">View profile</DashboardSecondaryAction></Link></Box>
                </Stack>
              </Stack>
            </Stack>
            <Box sx={{ gridColumn: "1 / -1", p: { xs: 1.75, sm: 2.25 } }}>
              <CommunityWatchlistTickerBoard detail={detail} editable={editable} tickerFacts={tickerFacts} watchlistSlug={watchlistName} />
            </Box>
          </Box>
        </Paper>
      </Stack>
    </DashboardPage>
  );
}
