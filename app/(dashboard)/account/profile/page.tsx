import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { AccountSettingsLayout } from "../account-settings-layout";

export const metadata: Metadata = {
  description: "Review your TraderLink profile and sign-in access.",
  title: "Profile | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountProfilePage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const profile = withReadonlyPlatformDatabase({}, (database) =>
    new PlatformAccountProfileReadService(database).get(scope));

  return (
    <AccountSettingsLayout
      activeSection="profile"
      description="Review your TraderLink profile and sign-in information."
      title="Profile"
    >
      <DashboardPanel title="Profile">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <AccountCircleRoundedIcon color="primary" sx={{ fontSize: 52 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 850 }} variant="h2">{profile.displayName}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{profile.authenticationLabel}</Typography>
          </Box>
          <Chip color="success" label={profile.accessMode === "local_development" ? "Local review access" : "Signed in"} />
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Workspace">
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
          <Box><Typography color="text.secondary" variant="caption">Workspace</Typography><Typography sx={{ fontWeight: 750 }}>{profile.workspace.displayName}</Typography></Box>
          <Box><Typography color="text.secondary" variant="caption">Access</Typography><Typography sx={{ fontWeight: 750, textTransform: "capitalize" }}>{profile.workspace.role}</Typography></Box>
          <Box><Typography color="text.secondary" variant="caption">Default timezone</Typography><Typography sx={{ fontWeight: 750 }}>{profile.workspace.defaultTradingTimezone}</Typography></Box>
        </Box>
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
