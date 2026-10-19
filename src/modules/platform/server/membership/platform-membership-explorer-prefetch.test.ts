// @vitest-environment node
import { expect, it, vi } from "vitest";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
const fixture = vi.hoisted(() => ({ prefetch: vi.fn(), denied: new Error("membership_required") }));
vi.mock("./platform-membership-access", () => ({ assertMembershipFeature: () => { throw fixture.denied; } }));
vi.mock("../database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_options: unknown, run: (db: object) => unknown) => run({}) }));
vi.mock("@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime", () => ({ withJournalAnalyticsReportingDashboardRuntime: fixture.prefetch }));
import { readTradeExplorerPageModel, runCompleteTradeExplorerTableQuery, runTradeExplorerComparison } from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service";
it.each([
  ["page", (scope: WorkspaceAccessScope) => readTradeExplorerPageModel(scope)],
  ["report table", (scope: WorkspaceAccessScope) => runCompleteTradeExplorerTableQuery(scope,{})],
  ["comparison", (scope: WorkspaceAccessScope) => runTradeExplorerComparison(scope,{})],
] as const)("denies %s before fact prefetch", async (_name, run) => {
  await expect(run({userId:"member"} as WorkspaceAccessScope)).rejects.toThrow(fixture.denied);
  expect(fixture.prefetch).not.toHaveBeenCalled();
});
