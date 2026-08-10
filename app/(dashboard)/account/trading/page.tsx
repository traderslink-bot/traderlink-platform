import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardPanel } from "../../../dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { MoomooExecutionImportCommandService } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-command-service";
import { AccountManagementClient } from "../account-management-client";
import { AccountSettingsLayout } from "../account-settings-layout";
import { BrokerConnectionPicker } from "../broker-connection-picker";
import { MoomooConnectionSettings } from "../moomoo-connection-settings";
import { MoomooExecutionImportSetup } from "../moomoo-execution-import-setup";

export const metadata: Metadata = {
  description: "Manage TraderLink Trade Tracker accounts and broker connections.",
  title: "Trading | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountTradingPage({
  searchParams,
}: {
  searchParams: Promise<{ moomoo?: string; reported?: string }>;
}) {
  const query = await searchParams;
  const scope = await requireTraderLinkPlatformPageScope();
  const { moomooAccountLinks, moomooConnection, profile } = withReadonlyPlatformDatabase({}, (database) => {
    const currentProfile = new PlatformAccountProfileReadService(database).get(scope);
    const currentAccount = currentProfile.journalAccounts.find((account) => account.active);
    return Object.freeze({
      moomooAccountLinks: currentAccount
        ? new MoomooExecutionImportCommandService(database).list(scope, scope.activeAccountId ?? "")
        : [],
      moomooConnection: new MoomooConnectionRepository(database).find(scope),
      profile: currentProfile,
    });
  });
  const activeAccount = profile.journalAccounts.find((account) => account.active) ?? null;
  const moomooConnectionFailed = ["failed", "invalid-state", "unavailable"].includes(query.moomoo ?? "");

  return (
    <AccountSettingsLayout
      activeSection="trading"
      description="Manage separate Trade Tracker accounts and the brokers connected to the selected account."
      title="Trading"
    >
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
        <AccountManagementClient activeAccountSelectionRef={activeAccount?.selectionRef ?? null} defaultTradingTimezone={profile.workspace.defaultTradingTimezone} />
      </DashboardPanel>

      <DashboardPanel title="Broker connections">
        <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
          Connect a broker to automatically import your trades.
        </Typography>
        {moomooConnectionFailed ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            The Moomoo connection could not be completed. {query.reported === "1"
              ? "The details were automatically sent to TradersLink administration, and we are working on it. "
              : ""}You can try connecting again later.
          </Alert>
        ) : null}
        <BrokerConnectionPicker moomooConnectionState={moomooConnection?.state ?? null} />
        {moomooConnection?.state === "active" ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mt: 2 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">Moomoo</Typography>
            <Chip color="success" label="Connected" size="small" />
            <MoomooConnectionSettings state="active" />
          </Stack>
        ) : null}
        {moomooConnection?.state === "active" && activeAccount ? (
          <MoomooExecutionImportSetup
            activeAccountName={activeAccount.displayName}
            activeAccountSelectionRef={activeAccount.selectionRef}
            executionReadAuthorized={moomooConnection.authorizedScopes.includes("trade:read")}
            initialLinkedAccounts={moomooAccountLinks}
          />
        ) : null}
      </DashboardPanel>
    </AccountSettingsLayout>
  );
}
