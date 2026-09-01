import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
} from "../dashboard-template";

export const AI_COMING_SOON_MESSAGE = "This feature is not part of the free beta yet. You can use Trade Tracker, your Journal, Calendar, Trading Rules and Analytics now.";

export function AiComingSoonMessage() {
  return (
    <Stack spacing={0.75}>
      <Typography color="text.primary" sx={{ fontWeight: 700 }}>
        Coming soon
      </Typography>
      <Typography color="text.primary" variant="body2">
        {AI_COMING_SOON_MESSAGE}
      </Typography>
    </Stack>
  );
}

export function AiComingSoonPage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <DashboardPage>
      <Stack spacing={1}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Typography component="h1" color="text.primary" variant="h1">
            {title}
          </Typography>
          <Chip color="primary" label="Coming soon" size="small" variant="outlined" />
        </Stack>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 760 }}
          variant="body2"
        >
          {description}
        </Typography>
      </Stack>
      <AiComingSoonMessage />
    </DashboardPage>
  );
}
