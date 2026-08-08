import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { CoachReviewDeliveryScheduleRepository } from "@/src/modules/coach/server/coach-weekly-review-schedule-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { AccountManagementClient } from "./account-management-client";
import { AiReviewFrequencySettings } from "./ai-review-delivery-settings";
import { BrokerConnectionPicker } from "./broker-connection-picker";
import { MoomooConnectionSettings } from "./moomoo-connection-settings";
import { ReportingCurrencySettings } from "./reporting-currency-settings";

export const metadata: Metadata = {
  description: "Review the active TraderLink profile, workspace and Trade Tracker account.",
  title: "Account | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const { profile, aiReviewSettings, moomooConnection } = withReadonlyPlatformDatabase({}, (database) => Object.freeze({
    profile: new PlatformAccountProfileReadService(database).get(scope),
    aiReviewSettings: new CoachReviewDeliveryScheduleRepository(database).readV2(scope),
    moomooConnection: new MoomooConnectionRepository(database).find(scope),
  }));
  const activeAccount = profile.journalAccounts.find((account) => account.active);
  if (!activeAccount) throw new Error("TRADERLINK_ACCOUNT_ACCESS_DENIED");

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Platform
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Account</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          Your profile, workspace access and trading-account settings use the same stable ownership as your Trade Tracker data.
        </Typography>
      </Box>

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

      <DashboardPanel title="Reporting currency">
        <ReportingCurrencySettings reportingCurrency={profile.reportingCurrency} />
      </DashboardPanel>

      <DashboardPanel title="AI Review frequency">
        <AiReviewFrequencySettings initialSettings={aiReviewSettings} />
      </DashboardPanel>

      <DashboardPanel title="Broker connections">
        <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
          Connect a broker to automatically import your trades.
        </Typography>
        <BrokerConnectionPicker moomooConnectionState={moomooConnection?.state ?? null} />
        {moomooConnection?.state === "active" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mt: 2 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">Moomoo</Typography>
            <Chip color="success" label="Connected" size="small" />
            <MoomooConnectionSettings state="active" />
          </Stack>
        ) : null}
      </DashboardPanel>

      <DashboardPanel title="Trade Tracker accounts">
        <Stack spacing={1.5}>
          {profile.journalAccounts.map((account) => (
            <Box key={account.selectionRef} sx={{ alignItems: { sm: "center" }, border: 1, borderColor: "divider", borderRadius: 1.5, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", p: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>{account.displayName}</Typography>
                <Typography color="text.secondary" variant="body2">{account.baseCurrency} · {account.tradingTimezone}</Typography>
              </Box>
              {account.active ? <Chip color="primary" label="Active Trade Tracker account" size="small" /> : null}
            </Box>
          ))}
        </Stack>
      </DashboardPanel>

      <DashboardPanel title="Create a Trade Tracker account">
        <AccountManagementClient
          activeAccountSelectionRef={activeAccount.selectionRef}
          defaultTradingTimezone={profile.workspace.defaultTradingTimezone}
        />
      </DashboardPanel>

      <DashboardPanel title="Login readiness">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
          <LockRoundedIcon color="primary" />
          <Typography color="text.secondary" variant="body2">
            Local review remains available only from this computer without Discord. Discord is the first public login provider and will be connected to this existing Platform ownership before launch; email login remains optional.
          </Typography>
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
