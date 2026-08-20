import { getReplacementDailyTradeAnalyzerReplay, scaleDaySessionTradeAnalyzer } from
  "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { journalReportingCurrencyMultiplier } from
  "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const roundTripId = url.searchParams.get("roundTripId") ?? "";
    const direction = url.searchParams.get("direction");
    if (!UUID_PATTERN.test(roundTripId) || (direction !== "long" && direction !== "short")) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "trade" });
    }
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const analysis = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext }) => {
        const source = getReplacementDailyTradeAnalyzerReplay(scope, { direction, roundTripId });
        if (!source) return null;
        const sourceCurrency = reportingContext.sourceCurrencyByRoundTrip.get(roundTripId);
        const sourceDate = reportingContext.sourceDateByRoundTrip.get(roundTripId);
        const multiplier = sourceCurrency && sourceDate
          ? journalReportingCurrencyMultiplier(sourceCurrency, sourceDate, reportingContext)
          : "1";
        return scaleDaySessionTradeAnalyzer(source, multiplier);
      },
    );
    if (!analysis || analysis.status !== "ready") {
      return Response.json({ status: "unavailable" }, {
        status: 404,
        headers: { "cache-control": "no-store" },
      });
    }
    return Response.json({ analysis, status: "ready" }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { status: "unavailable" },
      { status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
