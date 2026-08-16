import { getReplacementDailyTradeAnalyzerReplay } from
  "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { readDailyTradePatternOccurrence } from
  "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const url = new URL(request.url);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const occurrence = withReadonlyPlatformDatabase({}, (database) =>
      readDailyTradePatternOccurrence(
        database,
        scope,
        url.searchParams.get("ref") ?? "",
        url.searchParams.get("basis") === "net" ? "net" : "gross",
      ));
    const analysis = getReplacementDailyTradeAnalyzerReplay(scope, {
      direction: occurrence.direction,
      roundTripId: occurrence.roundTripId,
    });
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
