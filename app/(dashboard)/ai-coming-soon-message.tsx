"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

export const AI_COMING_SOON_MESSAGE = "This feature is not part of the free beta yet. You can use Trade Tracker, your Journal, Calendar, Trading Rules and Analytics now.";

export function AiComingSoonMessage() {
  const theme = useTheme();

  return (
    <Stack spacing={0.75}>
      <Typography sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
        Coming soon
      </Typography>
      <Typography sx={{ color: theme.palette.text.primary }} variant="body2">
        {AI_COMING_SOON_MESSAGE}
      </Typography>
    </Stack>
  );
}
