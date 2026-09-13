import { withSavedPatternRuntime } from "@/src/modules/level-analysis/server/trend-momentum-pattern-runtime";
import { pageSavedPatternEvidence } from "@/src/modules/level-analysis/server/trend-momentum-pattern-evidence";
import { readMovementFilters } from "@/src/lib/trade-candle-analysis/trend-momentum-movement-filter";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url), query = url.searchParams;
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const timeframe = query.get("timeframe") ?? "all", execution = query.get("execution") ?? "all", location = query.get("location") ?? "all", direction = query.get("direction");
    if (!["all", "1m", "5m"].includes(timeframe) || !["all", "entry", "exit"].includes(execution) || !["all", "exact", "before"].includes(location) || (direction !== "long" && direction !== "short")) {
      return Response.json({ status: "invalid_filters" }, { status: 400, headers: { "cache-control": "no-store" } });
    }
    const selection = { basis: query.get("basis"), startDate: query.get("start")?.trim() || null, endDate: query.get("end")?.trim() || null };
    const page = await withSavedPatternRuntime(scope, selection, ({ observations, timezone, runtime }) => pageSavedPatternEvidence(observations, {
      filters: readMovementFilters(query), pattern: query.get("pattern") ?? "", ticker: (query.get("ticker") ?? "").slice(0, 32), direction,
      timeframe: timeframe as "all" | "1m" | "5m", execution: execution as "all" | "entry" | "exit", location: location as "all" | "exact" | "before",
      pageSize: Number(query.get("pageSize") ?? 25), cursor: query.get("cursor"), currency: runtime.reportingCurrency, timezone,
      selectionIdentity: JSON.stringify([scope.workspaceId, scope.activeAccountId, selection]),
    }));
    return Response.json({ status: "ready", page }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = isTraderLinkPlatformError(error) ? error.code : "TRADERLINK_TRADE_ANALYZER_EVIDENCE_UNAVAILABLE";
    return Response.json({ status: "unavailable", code }, { status: code.includes("ACCESS_DENIED") ? 403 : code.includes("VALIDATION_FAILED") ? 400 : 503, headers: { "cache-control": "no-store" } });
  }
}
