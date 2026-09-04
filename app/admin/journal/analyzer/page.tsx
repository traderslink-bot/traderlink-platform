import type { Metadata } from "next";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { SharedAnalyzerAdministrationRepository } from "@/src/modules/level-analysis/server/shared-analyzer-administration-repository";
import { JournalAdminMetricCard, JournalAdminMetricGrid, JournalAdminPage, JournalAdminPageHeader, JournalAdminPanel, formatAdminInteger } from "../journal-admin-ui";
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
    <JournalAdminPanel title="Shared Analyzer settings"><AnalyzerSettingsControl model={model} /></JournalAdminPanel>
    <JournalAdminPanel title="User allowances"><AnalyzerUserControl users={model.users} /></JournalAdminPanel>
  </JournalAdminPage>;
}
