import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage, DashboardSecondaryAction } from "../../../../../dashboard-template";
import { CommunityWatchlistTickerCards } from "../../../watchlists/community-watchlist-cards";

export const metadata: Metadata = {
  title: "Community watchlist | TraderLink Platform",
};

export default async function CommunityWatchlistDetailPage({
  params,
}: {
  params: Promise<{ userName: string; watchlistName: string }>;
}) {
  const { userName, watchlistName } = await params;
  await requireTraderLinkPlatformPageScope();
  const detail = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).findPublished(userName, watchlistName),
  );
  if (!detail) notFound();
  return <DashboardPage><Stack spacing={2}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}><Box><Typography component="h1" variant="h1">{detail.title}</Typography>{detail.tags.length ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 1, rowGap: 0.75 }}>{detail.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Stack> : null}{detail.description ? <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{detail.description}</Typography> : null}</Box><Link href={`/community/${detail.authorHandle}`} style={{ textDecoration: "none" }}><DashboardSecondaryAction component="span">@{detail.authorHandle}</DashboardSecondaryAction></Link></Stack><Box><Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">{detail.symbolCount} {detail.symbolCount === 1 ? "symbol" : "symbols"}</Typography><CommunityWatchlistTickerCards detail={detail} /></Box><Alert severity="info">Shared research from a trader, not a TradersLink recommendation or investment advice.</Alert></Stack></DashboardPage>;
}
