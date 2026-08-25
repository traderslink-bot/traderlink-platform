"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import type { CommunityWatchlistDetail } from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPage, DashboardPrimaryAction } from "../../../dashboard-template";
import { CommunityWatchlistCard } from "./community-watchlist-cards";

type HubTab = "mine" | "shared" | "following";

type CommunityWatchlistHubItem = Readonly<{
  detail: CommunityWatchlistDetail;
  editable: boolean;
  following: boolean;
}>;

function WatchlistCards({ items }: { items: readonly CommunityWatchlistHubItem[] }) {
  if (!items.length) return null;
  return <Box sx={{ display: "grid", gap: 1.5, maxWidth: 880 }}>
    {items.map((item) => <CommunityWatchlistCard
      detail={item.detail}
      editable={item.editable}
      initiallyExpanded={false}
      initiallyFollowing={item.following}
      key={`${item.detail.authorHandle}-${item.detail.slug}`}
      tickerFacts={{}}
      watchlistSlug={item.detail.slug}
    />)}
  </Box>;
}

function EmptyWatchlists({ tab }: { tab: HubTab }) {
  const copy = tab === "mine"
    ? "Your watchlists will appear here."
    : tab === "following"
      ? "Watchlists you follow will appear here."
      : "No shared watchlists yet.";
  const detail = tab === "mine"
    ? "Create a private draft when you are ready to organize a research list."
    : tab === "following"
      ? "Use Follow Watchlist on a trader's shared list to keep it here."
      : "Published trader research will appear here as traders begin sharing.";
  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, maxWidth: 880, px: 2.5, py: 3.25 }}><Typography sx={{ fontWeight: 820 }}>{copy}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{detail}</Typography></Box>;
}

export function CommunityWatchlistsHub({
  following,
  mine,
  shared,
}: {
  following: readonly CommunityWatchlistHubItem[];
  mine: readonly CommunityWatchlistHubItem[];
  shared: readonly CommunityWatchlistHubItem[];
}) {
  const [tab, setTab] = useState<HubTab>("mine");
  const items = tab === "mine" ? mine : tab === "shared" ? shared : following;
  return (
    <DashboardPage>
      <Box sx={{ alignItems: { sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between" }}>
        <Typography component="h1" variant="h1">Community Watchlists</Typography>
        <DashboardPrimaryAction component={Link} href="/community/watchlists/new" startIcon={<AddRoundedIcon />}>Create watchlist</DashboardPrimaryAction>
      </Box>
      <Tabs aria-label="Community Watchlists" onChange={(_, value: HubTab) => setTab(value)} value={tab}>
        <Tab label="My Watchlists" value="mine" />
        <Tab label="Shared Watchlists" value="shared" />
        <Tab label="Following" value="following" />
      </Tabs>
      <WatchlistCards items={items} />
      {!items.length ? <EmptyWatchlists tab={tab} /> : null}
    </DashboardPage>
  );
}
