import type { Metadata } from "next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../../dashboard-template";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics Lab | TraderLink Platform",
  description: "Build custom analytics views from replacement Journal facts.",
};

export default function AnalyticsLabPage() {
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Analytics
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Analytics Lab
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          The custom analytics builder is being connected to the replacement Journal Analytics registry.
        </Typography>
      </Box>
      <DashboardPanel title="Custom analytics builder">
        <DashboardUnavailableState
          description="The former V3 and sample-data runtime is disabled here. The complete Analytics Lab interface will return in its own reviewed migration slice using only accepted Journal facts."
          title="Replacement connection in progress"
        />
      </DashboardPanel>
    </DashboardPage>
  );
}
