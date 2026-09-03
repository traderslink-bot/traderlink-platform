import { getReplacementDailyTradeAnalyzerReplay } from
  "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { scaleDaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { readDailyTradePatternOccurrence } from
  "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { reportDailyTradePatternOccurrence } from
  "@/src/modules/level-analysis/server/daily-trade-analysis-reporting";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyMultiplier } from
  "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const { analysis, occurrence } = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext }) => {
        const sourceOccurrence = withReadonlyPlatformDatabase({}, (database) =>
          readDailyTradePatternOccurrence(
            database,
            scope,
            url.searchParams.get("ref") ?? "",
            url.searchParams.get("basis") === "net" ? "net" : "gross",
          ));
        const sourceAnalysis = getReplacementDailyTradeAnalyzerReplay(scope, {
          direction: sourceOccurrence.direction,
          roundTripId: sourceOccurrence.roundTripId,
        });
        const sourceCurrency = reportingContext.sourceCurrencyByRoundTrip
          .get(sourceOccurrence.roundTripId);
        const sourceDate = reportingContext.sourceDateByRoundTrip
          .get(sourceOccurrence.roundTripId);
        const multiplier = sourceCurrency && sourceDate
          ? journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, reportingContext)
          : "1";
        return Object.freeze({
          analysis: sourceAnalysis
            ? scaleDaySessionTradeAnalyzer(sourceAnalysis, multiplier)
            : null,
          occurrence: reportDailyTradePatternOccurrence(
            sourceOccurrence,
            reportingContext,
          ),
        });
      },
    );
    if (!analysis || analysis.status !== "ready") {
      return Response.json({ status: "unavailable", occurrence }, {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }
    return Response.json({ status: "ready", analysis, occurrence }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_TRADE_ANALYZER_REPLAY_UNAVAILABLE";
    return Response.json({ status: "unavailable", code }, {
      status: code.includes("ACCESS_DENIED") ? 403 :
        code.includes("VALIDATION_FAILED") ? 400 : 503,
    });
  }
}
