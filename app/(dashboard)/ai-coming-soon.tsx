import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import { AiComingSoonMessage } from "./ai-coming-soon-message";
import {
  DashboardPage,
} from "../dashboard-template";

export function AiComingSoonPage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const theme = useTheme();
  const descriptionColor = theme.palette.mode === "dark"
    ? theme.palette.text.primary
    : theme.palette.text.secondary;

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
          sx={{ color: descriptionColor, maxWidth: 760 }}
          variant="body2"
        >
          {description}
        </Typography>
      </Stack>
      <AiComingSoonMessage />
    </DashboardPage>
  );
}
