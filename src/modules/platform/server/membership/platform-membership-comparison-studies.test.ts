// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
const fixture = vi.hoisted(() => ({ allowed: false, read: vi.fn(), create: vi.fn(), update: vi.fn(), retire: vi.fn(), denied: new Error("membership_required") }));
vi.mock("./platform-membership-access", () => ({ assertMembershipFeature: (_db: unknown, _user: string, key: string) => { expect(key).toBe("analytics.compare_trades"); if (!fixture.allowed) throw fixture.denied; } }));
vi.mock("../database/open-readonly-platform-database", () => ({ withReadonlyPlatformDatabase: (_options: unknown, run: (db: object) => unknown) => run({}) }));
vi.mock("../database/open-platform-database", () => ({ withPlatformDatabase: (_options: unknown, run: (db: object) => unknown) => run({}) }));
vi.mock("../authentication/require-platform-request-scope", () => ({ currentJournalAccountSelectionRef: () => "selection", requireExpectedJournalAccountSelection: vi.fn() }));
vi.mock("@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service", () => ({ normalizeTradeExplorerComparison: () => ({ groups: [] }) }));
vi.mock("@/src/modules/journal-analytics/server/trade-explorer-comparison-study-repository", () => ({ TradeExplorerComparisonStudyRepository: class {} }));
vi.mock("@/src/modules/journal-analytics/server/trade-explorer-comparison-study-service", () => ({ TradeExplorerComparisonStudyService: class { list = fixture.read; create = fixture.create; update = fixture.update; retire = fixture.retire; } }));
import { listTradeExplorerComparisonStudies, createTradeExplorerComparisonStudy, updateTradeExplorerComparisonStudy, retireTradeExplorerComparisonStudy } from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-comparison-study-runtime";
const scope = { userId: "member", activeAccountId: "account", allowedAccountIds: ["account"] } as unknown as WorkspaceAccessScope;
beforeEach(() => { fixture.allowed = false; for (const spy of [fixture.read, fixture.create, fixture.update, fixture.retire]) spy.mockReset(); fixture.read.mockReturnValue([]); });
it.each([
  ["list", () => listTradeExplorerComparisonStudies(scope)],
  ["create", () => createTradeExplorerComparisonStudy(scope, { name: "Study", comparison: {} })],
  ["update", () => updateTradeExplorerComparisonStudy(scope, { name: "Study", comparison: {}, studyId: "study", expectedRevision: 1 })],
  ["retire", () => retireTradeExplorerComparisonStudy(scope, { expectedAccountSelectionRef: "selection", studyId: "study", expectedRevision: 1 })],
] as const)("denies %s before saved-study reads or writes", (_name, run) => {
  expect(run).toThrow(fixture.denied);
  for (const spy of [fixture.read, fixture.create, fixture.update, fixture.retire]) expect(spy).not.toHaveBeenCalled();
});
