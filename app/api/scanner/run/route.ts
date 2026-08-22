import { hasScannerEarlyAccess } from "@/src/modules/scanner/server/scanner-early-access";
import { MoomooStockScreenService } from "@/src/modules/scanner/server/moomoo-stock-screen-service";
import { SCANNER_FILTER_IDS, type ScannerFilterId, type ScannerRunRequest, type ScannerSort } from "@/src/modules/scanner/scanner-contract";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filterIds = new Set<string>(SCANNER_FILTER_IDS);
const sorts = new Set<ScannerSort>(["daily-change", "average-volume", "market-cap", "trade-heat", "option-volume"]);

function parse(body: unknown): ScannerRunRequest | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>;
  if (!Array.isArray(value.filters) || !sorts.has(value.sortBy as ScannerSort) || ![25, 50, 100].includes(value.limit as number)) return null;
  const filters = value.filters.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return [];
    const filter = candidate as Record<string, unknown>;
    if (!filterIds.has(filter.id as string)) return [];
    const strings = ["lower", "upper", "choice", "averageType", "averageLength", "period", "timeframe"] as const;
    if (strings.some((key) => filter[key] !== undefined && typeof filter[key] !== "string")) return [];
    return [{
      id: filter.id as ScannerFilterId,
      lower: filter.lower as string | undefined,
      upper: filter.upper as string | undefined,
      choice: filter.choice as string | undefined,
      averageType: filter.averageType as "MA" | "EMA" | undefined,
      averageLength: filter.averageLength as "5" | "9" | "10" | "20" | "50" | "100" | "200" | undefined,
      period: filter.period as "1" | "5" | "20" | "60" | undefined,
      timeframe: filter.timeframe as "1 minute" | "5 minutes" | "15 minutes" | "1 hour" | "Daily" | "Weekly" | "Monthly" | undefined,
    }];
  });
  if (filters.length !== value.filters.length) return null;
  return { filters, limit: value.limit as 25 | 50 | 100, sortBy: value.sortBy as ScannerSort };
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ code: "invalid_request" }, { status: 400 }); }
  const input = parse(body);
  if (!input) return Response.json({ code: "invalid_request" }, { status: 400 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    if (!hasScannerEarlyAccess(identity)) return Response.json({ code: "not_found" }, { status: 404 });
    const result = await new MoomooStockScreenService(new MoomooConnectionRepository(database)).run(identity.scope, input);
    return Response.json(result, { headers: { "cache-control": "private, no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "scanner_provider_unavailable";
    const code = ["scanner_connection_required", "scanner_filter_limit"].includes(message) ? message : "scanner_provider_unavailable";
    return Response.json({ code }, { status: code === "scanner_connection_required" ? 409 : 503 });
  } finally { database.close(); }
}
