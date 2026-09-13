import { beforeEach, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({ saved: null as unknown }));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestScope: () => ({ activeAccountId: "account" }),
  requireExpectedJournalAccountSelection: () => {},
}));
vi.mock("@/src/modules/platform/contracts/workspace-access-scope", () => ({
  narrowWorkspaceAccessToAccount: () => ({}),
}));
vi.mock("@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime", () => ({
  withJournalAnalyticsReportingDashboardRuntime: (_scope: unknown, callback: (value: unknown) => unknown) => callback({
    reportingContext: { sourceCurrencyByRoundTrip: new Map(), sourceDateByRoundTrip: new Map() },
    verifiedReadonlyDatabase: {},
  }),
}));
vi.mock("@/src/modules/level-analysis/server/logical-trade-analyzer-repository", () => ({
  LogicalTradeAnalyzerRepository: class { readCurrentByRoundTrip() { return state.saved; } },
}));
vi.mock("@/app/(dashboard)/trade-tracker/trade-tracker-platform-data", () => ({
  analyzerFiveMinuteContext: (value: unknown) => value,
  analyzerMetrics: (value: unknown) => value,
  getReplacementDailyTradeAnalyzerReplay: () => null,
  scaleDaySessionTradeAnalyzer: (value: unknown) => value,
}));
vi.mock("@/src/modules/level-analysis/server/analyzer-written-review-context", () => ({
  readAnalyzerWrittenReviewContext: () => null,
}));
vi.mock("@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set", () => ({
  journalReportingCurrencyMultiplier: () => "1",
}));
vi.mock("@/src/modules/journal/server/analytics/journal-profit-protection-outcome-service", () => ({
  readJournalProfitProtectionOutcome: () => ({ status: "not_applicable" }),
}));
import { GET } from "@/app/api/platform/trade-analyzer/trade/route";

beforeEach(() => { state.saved = null; });
const request = () => new Request("https://app.traderslink.pro/api/platform/trade-analyzer/trade?roundTripId=00000000-0000-4000-8000-000000000001&direction=long");

for (const [savedStatus, expectedStatus] of [
  ["provider_unavailable", "provider_unavailable"], ["no_coverage", "no_coverage"],
  ["expired", "expired"], ["correction_required", "execution_mismatch"], ["pending", "pending"],
]) test("returns the existing " + savedStatus + " outcome instead of hiding it as 404", async () => {
  state.saved = { status: savedStatus, availableAtUtc: null, analyzed: null, candles: [], mismatches: [], logicalTradeVersionId: "version" };
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect((await response.json()).analysis.status).toBe(expectedStatus);
});

test("a genuinely absent saved result remains unavailable", async () => {
  expect((await GET(request())).status).toBe(404);
});
