import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { buildJournalAnalyticsDashboardQuery, resolveJournalAnalyticsMoneyBasis, withJournalAnalyticsReportingDashboardRuntime } from "../../journal-analytics/server/journal-analytics-dashboard-runtime";
import type { JournalAnalyticsRoundTripTableRow } from "../../journal-analytics/contracts/analytics-result";
import { readSavedPatternPopulation } from "./trend-momentum-pattern-service";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

type Runtime = Parameters<Parameters<typeof withJournalAnalyticsReportingDashboardRuntime>[1]>[0];
export function withSavedPatternRuntime<T>(scope: WorkspaceAccessScope,
  input: { basis: string | null; startDate: string | null; endDate: string | null },
  operation: (value: ReturnType<typeof readSavedPatternPopulation> & { timezone: string; runtime: Runtime }) => T,
) {
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if ((input.startDate === null) !== (input.endDate === null) || (input.startDate && input.endDate &&
    (!validDate(input.startDate) || !validDate(input.endDate) || input.startDate > input.endDate))) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "dateRange" });
  }
  return withJournalAnalyticsReportingDashboardRuntime(scope, (runtime) => {
    const rows: JournalAnalyticsRoundTripTableRow[] = [];
    let cursor: string | null = null, timezone = "America/New_York";
    do {
      const page = runtime.service.getRoundTripAnalyticsTable(scope, buildJournalAnalyticsDashboardQuery(scope, {
        afterCursor: cursor, closingDateRange: { kind: "all_available" }, currency: runtime.reportingCurrency,
        moneyBasis: resolveJournalAnalyticsMoneyBasis(input.basis, runtime.pnlReportingBasis), metricIds: ["included_count"], pageSize: 200,
      }));
      rows.push(...page.rows); cursor = page.continuationCursor; timezone = page.timezone;
    } while (cursor !== null);
    return operation({ ...readSavedPatternPopulation({ database: runtime.verifiedReadonlyDatabase, scope, journalRows: rows,
      startDate: input.startDate, endDate: input.endDate }), timezone, runtime });
  });
}
