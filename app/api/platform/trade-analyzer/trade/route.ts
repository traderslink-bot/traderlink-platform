import { analyzerFiveMinuteContext, analyzerMetrics, getReplacementDailyTradeAnalyzerReplay, scaleDaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import Decimal from "decimal.js";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyMultiplier } from
  "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { readJournalProfitProtectionOutcome } from
  "@/src/modules/journal/server/analytics/journal-profit-protection-outcome-service";
import type { DailyTradeProfitProtectionOutcome } from
  "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { narrowWorkspaceAccessToAccount } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { LogicalTradeAnalyzerRepository } from
  "@/src/modules/level-analysis/server/logical-trade-analyzer-repository";
import type { DaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/[sessionDate]/day-session-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function scaleProfitProtectionOutcome(
  outcome: DailyTradeProfitProtectionOutcome,
  multiplier: string,
): DailyTradeProfitProtectionOutcome {
  if (multiplier === "1" || outcome.status === "comparison_unavailable" || outcome.status === "not_applicable") {
    return outcome;
  }
  const scale = (value: string) => new Decimal(value).times(multiplier).toFixed();
  if (outcome.status === "avoided_additional_loss") {
    return Object.freeze({
      ...outcome,
      actualGrossResultDecimal: scale(outcome.actualGrossResultDecimal),
      avoidedAdditionalLossDecimal: scale(outcome.avoidedAdditionalLossDecimal),
      counterfactualGrossResultDecimal: scale(outcome.counterfactualGrossResultDecimal),
    });
  }
  if (outcome.status === "gave_up_additional_profit") {
    return Object.freeze({
      ...outcome,
      actualGrossResultDecimal: scale(outcome.actualGrossResultDecimal),
      additionalProfitGivenUpDecimal: scale(outcome.additionalProfitGivenUpDecimal),
      counterfactualGrossResultDecimal: scale(outcome.counterfactualGrossResultDecimal),
    });
  }
  return Object.freeze({
    ...outcome,
    actualGrossResultDecimal: scale(outcome.actualGrossResultDecimal),
    counterfactualGrossResultDecimal: scale(outcome.counterfactualGrossResultDecimal),
  });
}

function logicalAnalyzerView(
  saved: ReturnType<LogicalTradeAnalyzerRepository["readCurrentByRoundTrip"]>,
): DaySessionTradeAnalyzer | null {
  if (!saved) return null;
  if (saved.status === "correction_required") {
    return {
      availableAtUtc: saved.availableAtUtc,
      candles: [],
      detailLoaded: true,
      detailVersionRef: saved.logicalTradeVersionId,
      events: [],
      executionMismatchSetId: null,
      executionMismatches: saved.mismatches.map((mismatch) => ({
        candleHigh: mismatch.candleHighDecimal,
        candleLow: mismatch.candleLowDecimal,
        candleTime: mismatch.candleTimeUtcSeconds,
        enteredPrice: mismatch.enteredPriceDecimal,
        executedAt: mismatch.event.executedAtUtc,
        executionId: mismatch.event.eventId,
        kind: mismatch.kind,
        quantity: mismatch.event.quantityDecimal,
        side: mismatch.side,
      })),
      finalExitPaths: [],
      greenToRed: { addedAfterPeakCount: 0, bestProfitOpportunityIndex: null,
        completedClosePeakAtUtcSeconds: null, completedClosePeakPnlDecimal: null,
        feesComplete: false, finalPnlDecimal: null, firstGreenAtUtcSeconds: null,
        firstRedAtUtcSeconds: null, firstRedPnlDecimal: null, firstRecoveryAtUtcSeconds: null,
        minutesFromPeakToRed: null, partialExitBeforeRedCount: 0, peakAtUtcSeconds: null,
        peakPnlDecimal: null, peakToFinalReversalDecimal: null, peakToRedReversalDecimal: null,
        positionQuantityAtPeakDecimal: null, positionQuantityAtRedDecimal: null,
        profitOpportunities: [], profitOpportunityThresholdDecimal: null,
        status: "unavailable", strongOpportunityThresholdDecimal: null },
      mismatchBrokerConfirmed: false,
      status: "execution_mismatch",
    };
  }
  if (!saved.analyzed) {
    const status = saved.status === "stale" ? "expired" : saved.status;
    return status === "pending" || status === "no_coverage" ||
      status === "provider_unavailable" || status === "expired"
      ? { availableAtUtc: saved.availableAtUtc, candles: [], detailLoaded: true,
          detailVersionRef: saved.logicalTradeVersionId, events: [],
          executionMismatchSetId: null, executionMismatches: [], finalExitPaths: [],
          greenToRed: { addedAfterPeakCount: 0, bestProfitOpportunityIndex: null,
            completedClosePeakAtUtcSeconds: null, completedClosePeakPnlDecimal: null,
            feesComplete: false, finalPnlDecimal: null, firstGreenAtUtcSeconds: null,
            firstRedAtUtcSeconds: null, firstRedPnlDecimal: null, firstRecoveryAtUtcSeconds: null,
            minutesFromPeakToRed: null, partialExitBeforeRedCount: 0, peakAtUtcSeconds: null,
            peakPnlDecimal: null, peakToFinalReversalDecimal: null, peakToRedReversalDecimal: null,
            positionQuantityAtPeakDecimal: null, positionQuantityAtRedDecimal: null,
            profitOpportunities: [], profitOpportunityThresholdDecimal: null,
            status: "unavailable", strongOpportunityThresholdDecimal: null },
          mismatchBrokerConfirmed: false, status }
      : null;
  }
  return {
    availableAtUtc: saved.availableAtUtc,
    candles: saved.candles.map((candle) => ({ close: candle.closeDecimal,
      high: candle.highDecimal, low: candle.lowDecimal, open: candle.openDecimal,
      time: candle.time, turnover: candle.turnoverDecimal ?? null, volume: candle.volumeDecimal })),
    detailLoaded: true,
    detailVersionRef: saved.logicalTradeVersionId,
    events: saved.analyzed.eventSnapshots.map((snapshot) => ({
      candleTime: snapshot.candleTime,
      eventId: snapshot.event.eventId,
      executedAt: snapshot.event.executedAtUtc,
      fees: snapshot.event.feesDecimal ?? null,
      fiveMinuteContext: analyzerFiveMinuteContext(snapshot.fiveMinuteContext),
      indicators: snapshot.indicators ? {
        ...snapshot.indicators,
        rsi14CalculationVersion: snapshot.indicators.rsi14CalculationVersion ?? null,
      } : null,
      kind: snapshot.event.kind,
      metrics: analyzerMetrics(snapshot.metrics),
      patterns: [...snapshot.patterns],
      price: snapshot.event.priceDecimal,
      quantity: snapshot.event.quantityDecimal,
      sequence: snapshot.event.sequence,
    })),
    executionMismatchSetId: null,
    executionMismatches: [],
    finalExitPaths: saved.analyzed.finalExitPaths.map((path) => ({
      favorableMove: path.favorableMoveDecimal,
      minutesAfterExit: path.minutesAfterExit,
      observedAt: path.observedAtCandleTime,
    })),
    greenToRed: saved.analyzed.greenToRed,
    mismatchBrokerConfirmed: false,
    status: saved.status === "ready" ? "ready" : "pending",
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const roundTripId = url.searchParams.get("roundTripId") ?? "";
    const roundTripVersionId = url.searchParams.get("roundTripVersionId");
    const direction = url.searchParams.get("direction");
    if (
      !UUID_PATTERN.test(roundTripId) ||
      (roundTripVersionId !== null && !UUID_PATTERN.test(roundTripVersionId)) ||
      (direction !== "long" && direction !== "short")
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "trade" });
    }
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (roundTripVersionId) {
      requireExpectedJournalAccountSelection(
        scope,
        url.searchParams.get("expectedAccountSelectionRef"),
      );
    }
    const result = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext, verifiedReadonlyDatabase }) => {
        const account = scope.activeAccountId
          ? narrowWorkspaceAccessToAccount(scope, scope.activeAccountId)
          : null;
        const logical = account
          ? logicalAnalyzerView(new LogicalTradeAnalyzerRepository(verifiedReadonlyDatabase)
              .readCurrentByRoundTrip(account, roundTripId))
          : null;
        const source = logical ?? getReplacementDailyTradeAnalyzerReplay(scope, {
          direction,
          roundTripId,
          roundTripVersionId: roundTripVersionId ?? undefined,
        });
        if (!source) return null;
        const profitProtection = logical ? Object.freeze({ status: "not_applicable" as const }) : readJournalProfitProtectionOutcome(
          verifiedReadonlyDatabase,
          scope,
          {
            events: source.events.flatMap((event) => event.kind === "temporary_flat" ? [] : [{
              eventId: event.eventId,
              executedAt: event.executedAt,
              kind: event.kind,
              metrics: event.metrics,
              price: event.price,
              quantity: event.quantity,
            }]),
            roundTripId,
          },
        );
        const sourceCurrency = reportingContext.sourceCurrencyByRoundTrip.get(roundTripId);
        const sourceDate = reportingContext.sourceDateByRoundTrip.get(roundTripId);
        const multiplier = sourceCurrency && sourceDate
          ? journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, reportingContext)
          : "1";
        return Object.freeze({
          analysis: scaleDaySessionTradeAnalyzer(source, multiplier),
          profitProtection: scaleProfitProtectionOutcome(profitProtection, multiplier),
        });
      },
    );
    if (!result || (!roundTripVersionId && result.analysis.status !== "ready" && result.analysis.status !== "pending")) {
      return Response.json({ status: "unavailable" }, {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }
    return Response.json({
      analysis: Object.freeze({
        ...result.analysis,
        profitProtection: result.profitProtection,
      }),
      status: "ready",
    }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { status: "unavailable" },
      { status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
