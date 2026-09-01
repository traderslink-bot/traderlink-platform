import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AiComingSoonMessage } from "./ai-coming-soon-message";
import { DashboardAppearanceText } from "./dashboard-appearance-text";
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
        <DashboardAppearanceText
          lightColor="text.secondary"
          sx={{ maxWidth: 760 }}
          variant="body2"
        >
          {description}
        </DashboardAppearanceText>
      </Stack>
      <AiComingSoonMessage />
    </DashboardPage>
  );
}
