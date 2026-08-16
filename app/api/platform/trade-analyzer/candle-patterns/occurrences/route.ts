import { readDailyTradePatternOccurrences } from
  "@/src/modules/level-analysis/server/daily-trade-analysis-evidence-service";
import { requireTraderLinkPlatformRequestScope } from
  "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from
  "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function optionalDate(value: string | null): string | null {
  return value?.trim() || null;
}

export function GET(request: Request): Response {
  try {
    const url = new URL(request.url);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const timeframe = url.searchParams.get("timeframe") ?? "all";
    const execution = url.searchParams.get("execution") ?? "all";
    const location = url.searchParams.get("location") ?? "all";
    const basis = url.searchParams.get("basis") === "net" ? "net" : "gross";
    if (
      !["all", "1m", "5m"].includes(timeframe) ||
      !["all", "entry", "exit"].includes(execution) ||
      !["all", "exact", "before"].includes(location)
    ) {
      return Response.json({ status: "invalid_filters" }, { status: 400 });
    }
    const page = withReadonlyPlatformDatabase({}, (database) =>
      readDailyTradePatternOccurrences(database, scope, {
        afterCursor: url.searchParams.get("cursor"),
        currency: (url.searchParams.get("currency") ?? "").toUpperCase(),
        endDate: optionalDate(url.searchParams.get("end")),
        execution: execution as "all" | "entry" | "exit",
        location: location as "all" | "exact" | "before",
        moneyBasis: basis,
        pageSize: Number(url.searchParams.get("pageSize") ?? 25),
        pattern: url.searchParams.get("pattern") ?? "",
        startDate: optionalDate(url.searchParams.get("start")),
        ticker: (url.searchParams.get("ticker") ?? "").slice(0, 32),
        timeframe: timeframe as "all" | "1m" | "5m",
      }));
    return Response.json({ status: "ready", page }, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_TRADE_ANALYZER_EVIDENCE_UNAVAILABLE";
    return Response.json({ status: "unavailable", code }, {
      status: code.includes("ACCESS_DENIED") ? 403 :
        code.includes("VALIDATION_FAILED") ? 400 : 503,
    });
  }
}
