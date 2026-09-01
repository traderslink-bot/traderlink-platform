import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../dashboard-template";

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
          <Typography
            component="h1"
            sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.text.primary : undefined }}
            variant="h1"
          >
            {title}
          </Typography>
          <Chip color="primary" label="Coming soon" size="small" variant="outlined" />
        </Stack>
        <Typography
          color="text.secondary"
          sx={{
            color: (theme) => theme.palette.mode === "dark" ? theme.palette.text.primary : undefined,
            maxWidth: 760,
          }}
          variant="body2"
        >
          {description}
        </Typography>
      </Stack>
      <DashboardUnavailableState
        description="This feature is not part of the free beta yet. You can use Trade Tracker, your Journal, Calendar, Trading Rules and Analytics now."
        title="Coming soon"
      />
    </DashboardPage>
  );
}
