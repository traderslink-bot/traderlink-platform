"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { TraderLinkCommunityWatchlistPlacement } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type { CommunityWatchlistResearch } from "@/src/modules/communities/contracts/community-watchlist-research";
import {CommunityDestinationPicker} from "./community-destination-picker";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { CommunityPublicationForm } from "./community-publication-form";
import { saveCommunityWatchlistWithFeedback } from "./community-publication-actions";
import { CommunityWatchlistResearchFields } from "./community-watchlist-research-fields";

export function CommunityWatchlistEditor({ communitySlug, watchlist, research, isReview, publishing }: {
  publishing?:TraderLinkCommunityDashboardSnapshot["publishing"];communitySlug: string; watchlist: TraderLinkCommunityWatchlistPlacement; research: CommunityWatchlistResearch; isReview: boolean;
}) {
  return <CommunityPublicationForm action={saveCommunityWatchlistWithFeedback} disabled={isReview}>
    <input name="communitySlug" type="hidden" value={communitySlug}/>
    <input name="watchlistId" type="hidden" value={watchlist.watchlistId}/>
    <Stack spacing={2}>
      <TextField defaultValue={watchlist.title} label="Watchlist title" name="title" required/>
      <TextField defaultValue={watchlist.description} label="Watchlist notes" minRows={3} multiline name="description"/>
      <CommunityWatchlistResearchFields initialSymbols={watchlist.symbols} initialResearch={research}/>
      <TextField defaultValue={watchlist.publishingMode ?? "tracked_page"} label="Publishing" name="publishingMode" select>
        <MenuItem value="tracked_page">Tracked TraderLink page</MenuItem><MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <CommunityDestinationPicker publishing={publishing} kind="watchlists" objectId={watchlist.watchlistId}/><Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button name="status" type="submit" value="draft" variant="outlined">{watchlist.status === "archived" ? "Restore draft" : watchlist.status === "published" ? "Unpublish" : "Save draft"}</Button>
        <Button name="status" type="submit" value="published" variant="contained">{watchlist.status === "published" ? "Save watchlist" : "Publish watchlist"}</Button>
        <Button color="error" name="status" type="submit" value="archived" variant="outlined">Archive watchlist</Button>
      </Stack>
    </Stack>
  </CommunityPublicationForm>;
}
