import { describe, expect, it, vi } from "vitest";

import type { DailyTradeLongTermAnalyticsModel } from
  "@/src/modules/level-analysis/server/daily-trade-long-term-analytics-service";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatTradeAnalyzerToolService } from
  "./coach-ai-chat-trade-analyzer-tool-service";

const accountId = "91000000-0000-4000-8000-000000000003";
const roundTripId = "91000000-0000-4000-8000-000000000004";
const privateReviewId = "91000000-0000-4000-8000-000000000005";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "91000000-0000-4000-8000-000000000001",
  workspaceId: "91000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});
const emptyBreakdown = Object.freeze([]);

function model(): DailyTradeLongTermAnalyticsModel {
  return Object.freeze({
    analyzedExecutionCount: 2,
    analyzedTradeCount: 1,
    averageAdditionalOpportunityDecimal: "2.5",
    averagePnlDecimal: "50",
    averageReturnPercent: 25,
    coveragePercent: 100,
    currency: "USD",
    eligibleDayTradeCount: 1,
    eligibilityBoundary: "not_configured",
    entryContext: Object.freeze({
      ema9: emptyBreakdown,
      relativeVolume: emptyBreakdown,
      vwap: emptyBreakdown,
    }),
    exitContext: emptyBreakdown,
    greenToRed: emptyBreakdown,
    greenToRedDamage: Object.freeze({
      averageGreenToRedMinutes: null,
      averagePeakToFinalDamageDecimal: null,
      averagePeakToRedDamageDecimal: null,
      averageRecoveryMinutes: null,
      endedRedActualPnlDecimal: null,
      endedRedAdditionalOpportunityDecimal: null,
      endedRedPotentialPnlDecimal: null,
      endedRedTradeCount: 0,
      recoveryRatePercent: null,
    }),
    greenToRedTradeCount: 0,
    holding: emptyBreakdown,
    holdingDuration: emptyBreakdown,
    entryTime: emptyBreakdown,
    entryOpportunityRisk: Object.freeze({
      averageAdverseMoveDecimal: "0.1",
      averageFavorableMoveDecimal: "0.7",
      medianAdverseMoveDecimal: "0.1",
      medianFavorableMoveDecimal: "0.7",
      measuredExecutionCount: 1,
    }),
    excursions: Object.freeze([Object.freeze({
      actualPnlDecimal: "50",
      adverseMoveDecimal: "0.1",
      adverseMovePercent: 5,
      closeDate: "2026-08-14",
      direction: "long" as const,
      entryPriceDecimal: "2",
      eventKind: "Entry" as const,
      executionSequence: 1,
      favorableMoveDecimal: "0.7",
      favorableMovePercent: 35,
      minutesUntilFlat: 20,
      roundTripId,
      symbol: "TEST",
      trackerDate: "2026-08-14",
    })]),
    mfeMae: Object.freeze({
      averageAdverseMovePercent: 5,
      averageFavorableMovePercent: 35,
      breakdown: Object.freeze([]),
      medianAdverseMovePercent: 5,
      medianFavorableMovePercent: 35,
    }),
    malformedSnapshotCount: 0,
    moneyBasis: "net",
    opportunityTradeCount: 1,
    profitCapture: Object.freeze({
      averageCapturedPercent: 95,
      averagePeakToFinalGivebackDecimal: "2.5",
      medianCapturedPercent: 95,
      totalActualPnlDecimal: "50",
      totalAdditionalOpportunityDecimal: "2.5",
      totalPotentialPnlDecimal: "52.5",
    }),
    patterns: Object.freeze([]),
    riskManagement: Object.freeze({
      addedAfterPeak: emptyBreakdown,
      partialExitBeforeRed: emptyBreakdown,
    }),
    timezone: "America/New_York",
    trades: Object.freeze([Object.freeze({
      actualPnlDecimal: "50",
      additionalOpportunityDecimal: "2.5",
      capturedPercent: 95,
      closeDate: "2026-08-14",
      direction: "long" as const,
      executionCount: 2,
      greenToRedStatus: "green_no_red" as const,
      malformedSnapshotCount: 0,
      peakToExitMinutes: 2,
      returnPercent: 25,
      roundTripId,
      sustainedOpportunityDecimal: "52.5",
      symbol: "TEST",
      trackerDate: "2026-08-14",
    })]),
    winRatePercent: 100,
  });
}

function subject() {
  const analytics = {
    getRoundTripAnalyticsTable: vi.fn(() => Object.freeze({
      rows: Object.freeze([]),
      timezone: "America/New_York",
      continuationCursor: null,
    })),
  };
  const candles = {
    findTarget: vi.fn(() => Object.freeze({
      roundTripId,
      roundTripVersionId: "private-round-trip-version-id",
      assetClass: "Stock",
      symbol: "TEST",
      direction: "long" as const,
      openedAtUtc: "2026-08-14T13:30:00.000Z",
      closedAtUtc: "2026-08-14T14:00:00.000Z",
      entryPriceDecimal: "2",
      exitPriceDecimal: "2.5",
    })),
    readCurrent: vi.fn((_scope, target) => Object.freeze({
      candleReviewId: privateReviewId,
      revision: 3,
      target,
      status: "ready" as const,
      analysis: Object.freeze({
        entryTiming: Object.freeze({ kind: "finding" as const, title: "Entry", detail: "Near VWAP." }),
        exitTiming: Object.freeze({ kind: "finding" as const, title: "Exit", detail: "Held the move." }),
        profitGiveback: Object.freeze({ kind: "no_feedback" as const, title: "Giveback", detail: "None." }),
      }),
      observations: Object.freeze([]),
      indicators: Object.freeze([]),
      candles: Object.freeze([Object.freeze({
        time: 1,
        openDecimal: "2",
        highDecimal: "2.5",
        lowDecimal: "1.9",
        closeDecimal: "2.4",
        volumeDecimal: "1000",
      })]),
      analyzedAtUtc: "2026-08-14T15:00:00.000Z",
      refreshAvailableAtUtc: "2026-08-15T15:00:00.000Z",
    })),
  };
  const service = new CoachAiChatTradeAnalyzerToolService(
    {} as never,
    analytics as never,
    {
      candles,
      readCurrencies: vi.fn(() => Object.freeze(["USD"])),
      buildModel: vi.fn(() => model()),
      resolveTrade: vi.fn((_scope, tradeRef) =>
        /^[0-9a-f]{64}$/u.test(tradeRef) ? roundTripId : null),
    },
  );
  return { analytics, candles, service };
}

describe("CoachAiChatTradeAnalyzerToolService", () => {
  it("returns bounded saved Analyzer rows with opaque trade references", () => {
    const { service } = subject();
    const response = service.listTrades(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_analyzed_trades",
      filters: { moneyBasis: "net", currency: "USD", ticker: "test" },
      page: 1,
      pageSize: 25,
    }, "2026-08-15T12:00:00.000Z");
    expect(response.result).toMatchObject({
      totalRows: 1,
      rows: [{ ticker: "TEST", actualPnlDecimal: "50" }],
      savedAnalysisOnly: true,
    });
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain(roundTripId);
    expect(serialized).toMatch(/"tradeRef":"[0-9a-f]{64}"/u);
  });

  it("strips internal trade identifiers from MFE and MAE evidence", () => {
    const { service } = subject();
    const response = service.results(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_trade_analyzer_results",
      view: "mfe_mae",
      filters: { moneyBasis: "net", currency: "USD" },
    }, "2026-08-15T12:00:00.000Z");
    expect(response.result).toMatchObject({
      view: "mfe_mae",
      analysis: { excursions: [{ ticker: "TEST", favorableMoveDecimal: "0.7" }] },
    });
    expect(JSON.stringify(response)).not.toContain(roundTripId);
  });

  it("reads an existing Candle Review without returning candles or private identifiers", () => {
    const { candles, service } = subject();
    const tradeRef = "a".repeat(64);
    const response = service.savedCandleReview(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_saved_candle_review",
      tradeRef,
    });
    expect(response.result).toMatchObject({
      tradeRef,
      ticker: "TEST",
      savedReviewAvailable: true,
      candleSeriesIncluded: false,
      review: { status: "ready", entryTiming: { title: "Entry" } },
    });
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain(privateReviewId);
    expect(serialized).not.toContain("private-round-trip-version-id");
    expect(serialized).not.toContain("volumeDecimal");
    expect(candles.findTarget).toHaveBeenCalledTimes(1);
    expect(candles.readCurrent).toHaveBeenCalledTimes(1);
  });

  it("rejects a non-active selected account before reading Analyzer facts", () => {
    const { analytics, service } = subject();
    expect(() => service.results(scope,
      "91000000-0000-4000-8000-000000000099", {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "get_trade_analyzer_results",
        view: "day",
        filters: { moneyBasis: "net" },
      }, "2026-08-15T12:00:00.000Z")).toThrow();
    expect(analytics.getRoundTripAnalyticsTable).not.toHaveBeenCalled();
  });
});
