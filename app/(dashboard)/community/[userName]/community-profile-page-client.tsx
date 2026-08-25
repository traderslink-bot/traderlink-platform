"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import type { CommunityProfile } from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPanel } from "../../../dashboard-template";
import { setCommunityProfileFollow } from "../community-profile-actions";
import { CommunityWatchlistSummaryCard } from "../watchlists/community-watchlist-cards";

function ConnectionList({ items, empty }: { items: CommunityProfile["followers"]; empty: string }) {
  return items.length ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
    {items.map((item) => <Link href={`/community/${item.handle}`} key={item.handle} style={{ color: "#082b73", fontSize: "0.84rem", fontWeight: 800, textDecoration: "none" }}>@{item.displayName}</Link>)}
  </Stack> : <Typography color="text.secondary" variant="body2">{empty}</Typography>;
}

export function CommunityProfilePageClient({ profile, isOwner }: { profile: CommunityProfile; isOwner: boolean }) {
  const [following, setFollowing] = useState(profile.isFollowing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return <Stack spacing={2}>
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Box><Typography component="h1" variant="h1">@{profile.displayName}</Typography>{profile.description ? <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }} variant="body2">{profile.description}</Typography> : null}</Box>
        {!isOwner ? <Button disabled={saving} onClick={async () => {
          const nextFollowing = !following;
          setSaving(true);
          setMessage(null);
          const result = await setCommunityProfileFollow({ handle: profile.handle, following: nextFollowing });
          setSaving(false);
          if (result.ok) setFollowing(nextFollowing);
          setMessage(result.message);
        }} size="small" variant="outlined">{saving ? "Saving..." : following ? "Unfollow trader" : "Follow trader"}</Button> : null}
      </Stack>
      {message ? <Typography color="text.secondary" role="status" sx={{ mt: 0.75 }} variant="caption">{message}</Typography> : null}
    </Box>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
      <DashboardPanel title={`Followers · ${profile.followerCount}`}><ConnectionList empty="No followers yet." items={profile.followers} /></DashboardPanel>
      <DashboardPanel title={`Following · ${profile.followingCount}`}><ConnectionList empty="Not following anyone yet." items={profile.following} /></DashboardPanel>
    </Box>
    <DashboardPanel title="Shared watchlists"><Stack spacing={1.5}>{profile.watchlists.length ? profile.watchlists.map((item) => <CommunityWatchlistSummaryCard item={item} key={item.href} />) : <Typography color="text.secondary" variant="body2">No watchlists have been shared yet.</Typography>}</Stack></DashboardPanel>
  </Stack>;
}
