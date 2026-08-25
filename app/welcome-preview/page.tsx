import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

import { DashboardPage, DashboardPanel, DashboardPrimaryAction } from "../dashboard-template";

export const dynamic = "force-dynamic";

/** Staging-only visual review surface; the real route remains the signed-in /welcome flow. */
export default function WelcomePreviewPage() {
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "staging") notFound();

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Welcome to TradersLink</Typography>
      <DashboardPanel title="The Week Ahead">
        <Stack spacing={2} sx={{ maxWidth: 680 }}>
          <Typography color="text.secondary" variant="body1">
            Your TraderLink account is connected to Discord.
          </Typography>
          <FormControlLabel
            control={<Checkbox name="weekAheadNewsletter" value="yes" />}
            label="Send me The Week Ahead — a weekly look at small-cap stocks and upcoming catalysts to research — plus occasional TradersLink product, education, and community updates."
            sx={{ alignItems: "flex-start", m: 0 }}
          />
          <Typography color="text.secondary" variant="body2">
            Research ideas, not trade recommendations. Unsubscribe anytime.
          </Typography>
          <DashboardPrimaryAction sx={{ alignSelf: "flex-start" }} type="button">
            Continue to TradersLink
          </DashboardPrimaryAction>
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
