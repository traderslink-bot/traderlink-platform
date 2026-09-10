import type { Metadata } from "next";
import { Alert, Stack, Typography } from "@mui/material";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { SharedAnalyzerAdministrationRepository } from "@/src/modules/level-analysis/server/shared-analyzer-administration-repository";
import { JournalAdminMetricCard, JournalAdminMetricGrid, JournalAdminPage, JournalAdminPageHeader, JournalAdminPanel, formatAdminInteger, formatAdminUtc } from "../journal-admin-ui";
import { AnalyzerSettingsControl, AnalyzerUserControl } from "./analyzer-admin-controls";

export const metadata: Metadata = { title: "Trade Analyzer | Journal Administration" };
export const dynamic = "force-dynamic";

export default async function AnalyzerAdminPage() {
  const model = await withJournalAdminPageDatabase((database, scope) =>
    new SharedAnalyzerAdministrationRepository(database, scope).read());
  return <JournalAdminPage>
    <JournalAdminPageHeader description="" eyebrow="Trade Analyzer" title="Trade Analyzer" />
    <JournalAdminMetricGrid>
      <JournalAdminMetricCard caption="All recorded acquisitions" label="Total" value={formatAdminInteger(model.usage.total)} />
      <JournalAdminMetricCard caption="User allowance acquisitions" label="Charged" value={formatAdminInteger(model.usage.charged)} />
      <JournalAdminMetricCard caption="Correction allowance acquisitions" label="Corrections" value={formatAdminInteger(model.usage.waived)} />
      <JournalAdminMetricCard caption="All acquisitions" label="Rolling 24 hours" value={formatAdminInteger(model.usage.rolling)} />
    </JournalAdminMetricGrid>
    <JournalAdminPanel title="Shared Moomoo connection status">
      <Stack spacing={1.25}>
        <Typography sx={{ fontWeight: 800 }}>
          {model.sharedConnection.label ?? "No connection selected"}
        </Typography>
        <Alert severity={model.sharedConnection.state === "working" ? "success" : model.sharedConnection.state === "not_checked" ? "info" : model.sharedConnection.state === "not_configured" ? "warning" : "error"}>
          {model.sharedConnection.message}
        </Alert>
        <Typography color="text.secondary" variant="body2">
          Last shared-provider result: {formatAdminUtc(model.sharedConnection.lastProviderAttemptAtUtc)}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          If the shared connection fails, TraderLink notifies this connection owner and the TradersLink owner. The owner&apos;s confirmed notification email also receives the alert.
        </Typography>
      </Stack>
    </JournalAdminPanel>
    <JournalAdminPanel title="Shared Analyzer settings"><AnalyzerSettingsControl model={model} /></JournalAdminPanel>
    <JournalAdminPanel title="User allowances"><AnalyzerUserControl users={model.users} /></JournalAdminPanel>
  </JournalAdminPage>;
}
