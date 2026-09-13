import { withSavedPatternRuntime } from "@/src/modules/level-analysis/server/trend-momentum-pattern-runtime";
import { pageSavedAnalyzedTrades } from "@/src/modules/level-analysis/server/trend-momentum-analyzed-trades";
import { resolveJournalAnalyticsMoneyBasis } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  try {
    const query = new URL(request.url).searchParams, scope = requireTraderLinkPlatformRequestScope(request.headers);
    const page = await withSavedPatternRuntime(scope, { basis: query.get("basis"), startDate: query.get("start")?.trim() || null, endDate: query.get("end")?.trim() || null, includePatterns: false }, ({ trades, timezone, runtime }) => {
      query.set("basis", resolveJournalAnalyticsMoneyBasis(query.get("basis"), runtime.pnlReportingBasis));
      return pageSavedAnalyzedTrades(trades, { query, timezone, scopeIdentity: `${scope.workspaceId}:${scope.activeAccountId}:${runtime.reportingCurrency}`,
        pageSize: Number(query.get("pageSize") ?? 25), cursor: query.get("cursor"), ticker: (query.get("ticker") ?? "").slice(0, 32) });
    });
    return Response.json({ status: "ready", page }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = isTraderLinkPlatformError(error) ? error.code : "TRADERLINK_ANALYZED_TRADES_UNAVAILABLE";
    return Response.json({ status: "unavailable", code }, { status: code.includes("ACCESS_DENIED") ? 403 : code.includes("VALIDATION_FAILED") ? 400 : 503, headers: { "cache-control": "no-store" } });
  }
}
