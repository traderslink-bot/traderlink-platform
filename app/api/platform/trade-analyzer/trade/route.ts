import { getReplacementDailyTradeAnalyzerReplay, scaleDaySessionTradeAnalyzer } from
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
        const source = getReplacementDailyTradeAnalyzerReplay(scope, {
          direction,
          roundTripId,
          roundTripVersionId: roundTripVersionId ?? undefined,
        });
        if (!source) return null;
        const profitProtection = readJournalProfitProtectionOutcome(
          verifiedReadonlyDatabase,
          scope,
          {
            events: source.events,
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
    if (!result || (!roundTripVersionId && result.analysis.status !== "ready")) {
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
