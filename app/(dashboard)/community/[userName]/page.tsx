import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage, DashboardPanel } from "../../../dashboard-template";
import { CommunityWatchlistSummaryCard } from "../watchlists/community-watchlist-cards";

export const metadata: Metadata = {
  title: "Community profile | TraderLink Platform",
};

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ userName: string }>;
}) {
  const { userName } = await params;
  await requireTraderLinkPlatformPageScope();
  const profile = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).findProfile(userName),
  );
  if (!profile) notFound();
  return <DashboardPage><Stack spacing={2}><Box><Typography component="h1" variant="h1">@{profile.handle}</Typography>{profile.tags.length ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 1, rowGap: 0.75 }}>{profile.tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}</Stack> : null}</Box><DashboardPanel title="Shared watchlists"><Stack spacing={1.5}>{profile.watchlists.length ? profile.watchlists.map((item) => <CommunityWatchlistSummaryCard item={item} key={item.href} />) : <Typography color="text.secondary" variant="body2">No watchlists have been shared yet.</Typography>}</Stack></DashboardPanel></Stack></DashboardPage>;
}
