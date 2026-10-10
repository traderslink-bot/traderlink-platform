"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { saveCommunityWatchlistWithFeedback } from "./community-publication-actions";
import { CommunityPublicationForm } from "./community-publication-form";
import { CommunityWatchlistResearchFields } from "./community-watchlist-research-fields";

export function CommunityWatchlistComposer({communitySlug,isReview}:{communitySlug:string;isReview:boolean}) {
  return <CommunityPublicationForm action={saveCommunityWatchlistWithFeedback} disabled={isReview}>
    <input name="communitySlug" type="hidden" value={communitySlug}/>
    <Stack spacing={2}>
      <TextField label="Watchlist title" name="title" required/>
      <CommunityWatchlistResearchFields/>
      <TextField label="Notes" minRows={3} multiline name="description"/>
      <TextField defaultValue="tracked_page" label="Publishing" name="publishingMode" select>
        <MenuItem value="tracked_page">Tracked TraderLink page</MenuItem>
        <MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <Stack direction="row" spacing={1}><Button disabled={isReview} name="intent" type="submit" value="draft" variant="outlined">Save draft</Button><Button disabled={isReview} name="intent" type="submit" value="publish" variant="contained">Publish watchlist</Button></Stack>
    </Stack>
  </CommunityPublicationForm>;
}
