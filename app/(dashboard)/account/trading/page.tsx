import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { DashboardAccountSwitcher } from "@/app/dashboard-account-switcher";
import { DashboardPanel } from "../../../dashboard-template";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { MoomooExecutionImportCommandService } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-command-service";
import { isMoomooMarketDataReady } from "@/src/modules/level-analysis/server/moomoo-market-data-access";
import { AccountManagementClient } from "../account-management-client";
import { AccountSettingsLayout } from "../account-settings-layout";
import { BrokerConnectionPicker } from "../broker-connection-picker";
import { MoomooConnectionSettings } from "../moomoo-connection-settings";
import { MoomooExecutionImportSetup } from "../moomoo-execution-import-setup";
import { OfflineDataSettings } from "../offline-data-settings";
import { PnlReportingBasisSettings } from "../pnl-reporting-basis-settings";
import { ReportingCurrencySettings } from "../reporting-currency-settings";

export const metadata: Metadata = {
  description: "Manage TraderLink accounts, currency, broker connections and PWA app settings.",
  title: "General | TraderLink Platform",
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
  const { moomooAccountLinks, moomooConnection, moomooImportUnavailable, profile } = withReadonlyPlatformDatabase({}, (database) => {
    const currentProfile = new PlatformAccountProfileReadService(database).get(scope);
    const currentAccount = currentProfile.journalAccounts.find((account) => account.active);
    const currentMoomooConnection = new MoomooConnectionRepository(database).find(scope);
    let linkedAccounts: ReturnType<MoomooExecutionImportCommandService["list"]> = [];
    let importUnavailable = false;
    if (
      currentAccount &&
      currentMoomooConnection?.state === "active" &&
      currentMoomooConnection.authorizedScopes.includes("trade:read")
    ) {
      try {
        linkedAccounts = new MoomooExecutionImportCommandService(database).list(
          scope,
          scope.activeAccountId ?? "",
        );
      } catch (error) {
        if (
          !(error instanceof TraderLinkPlatformError) ||
          error.code !== "TRADERLINK_BROKER_CONNECTION_CONFIGURATION_INVALID"
        ) throw error;
        importUnavailable = true;
      }
    }
    return Object.freeze({
      moomooAccountLinks: linkedAccounts,
      moomooConnection: currentMoomooConnection,
      moomooImportUnavailable: importUnavailable,
      profile: currentProfile,
    });
  });
  const activeAccount = profile.journalAccounts.find((account) => account.active) ?? null;
  const moomooMarketDataReady = isMoomooMarketDataReady(moomooConnection);
  const moomooNeedsReconnect = moomooConnection !== null &&
    moomooConnection.state !== "revoked" &&
    !moomooMarketDataReady;
  const moomooPresentationState = moomooNeedsReconnect
    ? "reauthorization_required"
    : moomooConnection?.state ?? null;
  const moomooConnectionFailed = ["failed", "invalid-state", "unavailable"].includes(query.moomoo ?? "");

  return (
    <AccountSettingsLayout
      activeSection="trading"
      description="Manage your Trade Tracker accounts, reporting currency, broker connections and installed app."
      title="General"
    >
      <DashboardPanel
        action={<Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button href="/data-decisions" variant="outlined">Data Decisions</Button><DashboardAccountSwitcher accounts={profile.journalAccounts} /></Stack>}
        title="Trade Tracker accounts"
      >
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

      <DashboardPanel title="Reporting currency">
        <ReportingCurrencySettings reportingCurrency={profile.reportingCurrency} />
      </DashboardPanel>

      <DashboardPanel title="P/L preference">
        <PnlReportingBasisSettings pnlReportingBasis={profile.pnlReportingBasis} />
      </DashboardPanel>

      <DashboardPanel title="Broker connections">
        <Stack spacing={0.75} sx={{ mb: 2 }}>
          <Typography color="text.primary" variant="body2">
            Import your trade history.
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Currently, the app only supports connecting to Moomoo. For users with other brokers, you can <Link href="/imports">import</Link> your historical broker statements.
          </Typography>
        </Stack>
        {moomooConnectionFailed ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            The Moomoo connection could not be completed. {query.reported === "1"
              ? "The details were automatically sent to TradersLink administration, and we are working on it. "
              : ""}You can try connecting again later.
          </Alert>
        ) : null}
        {moomooImportUnavailable ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Moomoo trade imports are temporarily unavailable. Your Trade Tracker accounts and saved data are not affected.
          </Alert>
        ) : null}
        <BrokerConnectionPicker moomooConnectionState={moomooPresentationState} />
        {moomooMarketDataReady ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, mt: 2 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">Moomoo</Typography>
            <Chip color="success" label="Connected" size="small" />
            <MoomooConnectionSettings state="active" />
          </Stack>
        ) : null}
        {moomooNeedsReconnect ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
              <Typography variant="body2">
                Reconnect Moomoo to continue importing trades.
              </Typography>
              <MoomooConnectionSettings state="reauthorization_required" />
            </Stack>
          </Alert>
        ) : null}
        {moomooMarketDataReady && activeAccount && !moomooImportUnavailable ? (
          <MoomooExecutionImportSetup
            activeAccountName={activeAccount.displayName}
            activeAccountSelectionRef={activeAccount.selectionRef}
            executionReadAuthorized={moomooConnection?.authorizedScopes.includes("trade:read") ?? false}
            initialLinkedAccounts={moomooAccountLinks}
          />
        ) : null}
      </DashboardPanel>

      <Box id="pwa-app" sx={{ scrollMarginTop: 96 }}>
        <DashboardPanel title="Mobile and Desktop PWA App">
          <OfflineDataSettings
            accountSelectionRef={scope.activeAccountId
              ? currentJournalAccountSelectionRef(scope)
              : null}
            offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
          />
        </DashboardPanel>
      </Box>
    </AccountSettingsLayout>
  );
}
