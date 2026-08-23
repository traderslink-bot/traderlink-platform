import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { DashboardPage, DashboardSecondaryAction } from "../../../../../dashboard-template";
import { CommunityWatchlistTickerBoard } from "../../../watchlists/community-watchlist-cards";

export const metadata: Metadata = {
  title: "Community watchlist | TraderLink Platform",
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
  await requireTraderLinkPlatformPageScope();
  const detail = withReadonlyPlatformDatabase({}, (database) =>
    new CommunityWatchlistRepository(database).findPublished(userName, watchlistName),
  );
  if (!detail) notFound();
  return <DashboardPage><Stack spacing={1.75} sx={{ maxWidth: 1040 }}><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 760px) 224px" } }}><Paper elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden" }}><Stack spacing={1.5} sx={{ p: { xs: 1.75, sm: 2.25 } }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}><Box sx={{ minWidth: 0 }}><Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}><Typography component="h1" variant="h1">{detail.title}</Typography><Chip label={`${detail.symbolCount} ${detail.symbolCount === 1 ? "symbol" : "symbols"}`} size="small" sx={{ bgcolor: "#edf3ff", color: "#082b73", fontWeight: 800 }} /></Stack>{detail.description ? <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{detail.description}</Typography> : null}</Box></Stack>{detail.tags.length ? <Stack direction="row" spacing={0.65} sx={{ flexWrap: "wrap", rowGap: 0.65 }}>{detail.tags.map((tag, index) => <Chip key={tag} label={tag} size="small" sx={{ bgcolor: index % 2 ? "#e9f7ef" : "#edf3ff", color: index % 2 ? "#14663c" : "#082b73", fontWeight: 700 }} />)}</Stack> : null}<CommunityWatchlistTickerBoard detail={detail} /></Stack></Paper><Paper elevation={0} sx={{ alignSelf: "start", border: 1, borderColor: "divider", borderRadius: 2.5, p: 2.25, textAlign: "center" }}><Stack spacing={1.15} sx={{ alignItems: "center" }}><Avatar sx={{ bgcolor: "#102b69", fontWeight: 850, height: 64, width: 64 }}>{avatarLetters(detail.authorHandle)}</Avatar><Box><Typography sx={{ fontWeight: 850 }} variant="h3">@{detail.authorHandle}</Typography><Typography color="text.secondary" variant="body2">Community trader</Typography></Box><Typography color="text.secondary" variant="body2">Sharing small-cap research and watchlist ideas.</Typography><Link href={`/community/${detail.authorHandle}`} style={{ textDecoration: "none" }}><DashboardSecondaryAction component="span">View profile</DashboardSecondaryAction></Link></Stack></Paper></Box><Alert severity="info">Shared research from a trader, not a TradersLink recommendation or investment advice.</Alert></Stack></DashboardPage>;
}
