"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {CommunityDestinationPicker} from "./community-destination-picker";
import { saveCommunityWatchlistWithFeedback } from "./community-publication-actions";
import { CommunityPublicationForm } from "./community-publication-form";
import { CommunityWatchlistResearchFields } from "./community-watchlist-research-fields";

export function CommunityWatchlistComposer({communitySlug,isReview,publishing}:{communitySlug:string;isReview:boolean;publishing?:TraderLinkCommunityDashboardSnapshot["publishing"]}) {
  return <CommunityPublicationForm action={saveCommunityWatchlistWithFeedback} disabled={isReview}>
    <input name="communitySlug" type="hidden" value={communitySlug}/>
    <Stack spacing={2}>
      <TextField label="Watchlist title" name="title" required/>
      <CommunityWatchlistResearchFields/>
      <TextField label="Notes" minRows={3} multiline name="description"/>
      <TextField defaultValue="tracked_page" label="Publishing" name="publishingMode" select>
        <MenuItem value="tracked_page">Post a tracked-page link to Discord</MenuItem>
        <MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <CommunityDestinationPicker publishing={publishing} kind="watchlists"/><Stack direction="row" spacing={1}><Button disabled={isReview} name="intent" type="submit" value="draft" variant="outlined">Save draft</Button><Button disabled={isReview} name="intent" type="submit" value="publish" variant="contained">Publish watchlist</Button></Stack>
    </Stack>
  </CommunityPublicationForm>;
}
