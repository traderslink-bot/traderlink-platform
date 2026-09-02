import { getReplacementReportingDaySession } from "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { addExactDecimals } from "@/src/modules/journal-analytics/server/exact-analytics-math";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionDate: string }> },
): Promise<Response> {
  try {
    const { sessionDate } = await context.params;
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(sessionDate)) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "sessionDate" });
    }
    const session = await getReplacementReportingDaySession(
      requireTraderLinkPlatformRequestScope(request.headers),
      { date: sessionDate },
    );
    const sessionExecutionActivity = session?.executionActivity ?? [];
    const trades = (session?.tickers.flatMap((ticker) => ticker.roundTrips.map((trade) => {
      const shares = sessionExecutionActivity
        .filter((execution) => execution.roundTripKeys.includes(trade.roundTripKey))
        .reduce((total, execution) => addExactDecimals(total, execution.quantity), "0");
      return {
        direction: trade.direction,
        entryAt: trade.entryAt,
        pnl: trade.netPnl,
        roundTripId: trade.roundTripKey,
        shares,
        symbol: ticker.symbol,
        timezone: trade.timezone,
      };
    })) ?? []).sort((left, right) => left.entryAt.localeCompare(right.entryAt) || left.roundTripId.localeCompare(right.roundTripId));
    return Response.json({
      status: "ready",
      summary: {
        pnl: session?.netPnl ?? null,
        tradeCount: trades.length,
      },
      trades,
    }, { headers: { "cache-control": "private, no-store, max-age=0" } });
  } catch (error) {
    return Response.json({ status: "unavailable" }, {
      headers: { "cache-control": "private, no-store, max-age=0" },
      status: isTraderLinkPlatformError(error) ? 400 : 500,
    });
  }
}
