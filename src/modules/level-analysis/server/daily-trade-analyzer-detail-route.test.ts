import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

const scope: WorkspaceAccessScope = Object.freeze({
  activeAccountId: "00000000-0000-4000-8000-000000000003",
  allowedAccountIds: Object.freeze(["00000000-0000-4000-8000-000000000003"]),
  userId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
});

const mocks = vi.hoisted(() => ({
  readAnalysis: vi.fn(),
  requireExpectedSelection: vi.fn(),
  requireScope: vi.fn(),
  scaleAnalysis: vi.fn(),
  withReportingRuntime: vi.fn(),
}));

vi.mock(
  "@/src/modules/platform/server/authentication/require-platform-request-scope",
  () => ({
    requireExpectedJournalAccountSelection: mocks.requireExpectedSelection,
    requireTraderLinkPlatformRequestScope: mocks.requireScope,
  }),
);
vi.mock(
  "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data",
  () => ({
    getReplacementDailyTradeAnalyzerReplay: mocks.readAnalysis,
    scaleDaySessionTradeAnalyzer: mocks.scaleAnalysis,
  }),
);
vi.mock(
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime",
  () => ({
    withJournalAnalyticsReportingDashboardRuntime: mocks.withReportingRuntime,
  }),
);
vi.mock(
  "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set",
  () => ({ journalReportingCurrencyMultiplier: vi.fn(() => "1") }),
);

import { GET } from "@/app/api/platform/trade-analyzer/trade/route";

const roundTripId = "00000000-0000-4000-8000-000000000004";
const roundTripVersionId = "00000000-0000-4000-8000-000000000005";
const expectedAccountSelectionRef = "a".repeat(64);
const readyAnalysis = Object.freeze({
  detailLoaded: true,
  detailVersionRef: roundTripVersionId,
  status: "ready",
});

function request(includeVersion = true): Request {
  const query = new URLSearchParams({
    direction: "long",
    roundTripId,
  });
  if (includeVersion) {
    query.set("expectedAccountSelectionRef", expectedAccountSelectionRef);
    query.set("roundTripVersionId", roundTripVersionId);
  }
  return new Request(`http://127.0.0.1/api/platform/trade-analyzer/trade?${query}`);
}

describe("daily trade Analyzer detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireScope.mockReturnValue(scope);
    mocks.readAnalysis.mockReturnValue(readyAnalysis);
    mocks.scaleAnalysis.mockImplementation((analysis) => analysis);
    mocks.withReportingRuntime.mockImplementation(
      (_scope: WorkspaceAccessScope, operation: (input: {
        reportingContext: {
          sourceCurrencyByRoundTrip: Map<string, string>;
          sourceDateByRoundTrip: Map<string, string>;
        };
      }) => unknown) => operation({
        reportingContext: {
          sourceCurrencyByRoundTrip: new Map(),
          sourceDateByRoundTrip: new Map(),
        },
      }),
    );
  });

  it("requires the current account selection and round-trip version for Tracker detail", async () => {
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(mocks.requireExpectedSelection).toHaveBeenCalledWith(
      scope,
      expectedAccountSelectionRef,
    );
    expect(mocks.readAnalysis).toHaveBeenCalledWith(scope, {
      direction: "long",
      roundTripId,
      roundTripVersionId,
    });
    expect(await response.json()).toEqual({ analysis: readyAnalysis, status: "ready" });
  });

  it("does not return stale detail when the current version no longer matches", async () => {
    mocks.readAnalysis.mockReturnValue(null);

    const response = await GET(request());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });

  it("preserves the existing ready-only contract for legacy callers", async () => {
    mocks.readAnalysis.mockReturnValue({ ...readyAnalysis, status: "provider_unavailable" });

    const response = await GET(request(false));

    expect(response.status).toBe(404);
    expect(mocks.requireExpectedSelection).not.toHaveBeenCalled();
  });
});
