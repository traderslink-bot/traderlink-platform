import { buildJournalAnalyticsDashboardQuery, resolveJournalAnalyticsMoneyBasis, withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from
  "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9._:/-]{0,63}$/u;

function optionalDate(value: string | null, field: string): string | null {
  if (value === null || value.length === 0) return null;
  if (!DATE_PATTERN.test(value)) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  return value;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
    if (!SYMBOL_PATTERN.test(symbol)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "symbol" });
    }
    const startDate = optionalDate(url.searchParams.get("start"), "start");
    const endDate = optionalDate(url.searchParams.get("end"), "end");
    if ((startDate === null) !== (endDate === null) || (startDate && endDate && startDate > endDate)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "dateRange" });
    }
    const afterCursor = url.searchParams.get("after");
    if (afterCursor && afterCursor.length > 4_096) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "after" });
    }

    const result = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ pnlReportingBasis, reportingCurrency, service }) => {
        const baseQuery = buildJournalAnalyticsDashboardQuery(scope, {
          afterCursor,
          closingDateRange: startDate && endDate
            ? Object.freeze({ endDate, kind: "inclusive_closing_date" as const, startDate })
            : Object.freeze({ kind: "all_available" as const }),
          currency: reportingCurrency,
          metricIds: ["included_count"],
          moneyBasis: resolveJournalAnalyticsMoneyBasis(url.searchParams.get("basis"), pnlReportingBasis),
          pageSize: 25,
        });
        const query = Object.freeze({ ...baseQuery, symbols: Object.freeze([symbol]) });
        return service.getRoundTripAnalyticsTable(scope, query);
      },
    );

    return Response.json({
      currency: result.currency,
      nextCursor: result.continuationCursor,
      rows: result.rows.map((row) => Object.freeze({
        closedAtUtc: row.closedAtUtc,
        direction: row.direction,
        openedAtUtc: row.openedAtUtc,
        roundTripId: row.roundTripId,
        selectedPnlDecimal: row.selectedPnlDecimal,
        ticker: row.displayedSymbol,
        tradeClassification: row.tradeClassification,
        uniqueExecutionCount: row.uniqueExecutionCount,
      })),
      status: "ready",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json(
      { status: "error" },
      { status: isTraderLinkPlatformError(error) ? 400 : 500 },
    );
  }
}
