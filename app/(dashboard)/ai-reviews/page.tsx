import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { CoachWeeklyReviewScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { WeeklyReviewScheduleSettings } from "./weekly-review-schedule-settings";

export const metadata: Metadata = {
  title: "AI Reviews | TraderLink Platform",
  description: "Read your saved weekly trading reviews.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AiReviewsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const schedule = withReadonlyPlatformDatabase({}, (database) =>
    new CoachWeeklyReviewScheduleRepository(database).read(scope));

  return (
    <DashboardPage>
      <Box>
        <Typography component="h1" variant="h1">AI Reviews</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 720, mt: 1 }} variant="body2">
          Get a clear weekly breakdown of what worked, what held you back, and where to focus next—built around the trades, notes and rules you recorded.
        </Typography>
      </Box>

      <DashboardPanel title="Weekly reviews">
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 800 }}>No AI reviews yet</Typography>
          <Typography color="text.secondary" variant="body2">
            Your first weekly review will appear here after automatic delivery is set up.
          </Typography>
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Review schedule">
        <WeeklyReviewScheduleSettings
          initialDeliveryTimeEastern={schedule?.fridayDeliveryTimeEastern ?? null}
        />
      </DashboardPanel>
    </DashboardPage>
  );
}
