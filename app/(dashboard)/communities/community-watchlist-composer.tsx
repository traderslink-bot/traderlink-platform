"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { createCommunityServerWatchlistAction } from "./community-actions";

export function CommunityWatchlistComposer({communitySlug,isReview}:{communitySlug:string;isReview:boolean}) {
  return <Box action={isReview?undefined:createCommunityServerWatchlistAction} component="form">
    <input name="communitySlug" type="hidden" value={communitySlug}/>
    <Stack spacing={2}>
      <TextField label="Watchlist title" name="title" required/>
      <TextField label="Symbols" name="symbols" placeholder="NVDA, TSLA, SPY" required/>
      <TextField label="Notes" minRows={3} multiline name="description"/>
      <TextField defaultValue="tracked_page" label="Publishing" name="publishingMode" select>
        <MenuItem value="tracked_page">Tracked TraderLink page</MenuItem>
        <MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <Button disabled={isReview} type="submit" variant="contained">Publish watchlist</Button>
    </Stack>
  </Box>;
}
