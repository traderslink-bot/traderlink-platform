import { createHmac, randomBytes } from "node:crypto";
import { hasSharedChartDataAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import { matchesBrowserDataSession } from "@/src/modules/market-data/server/browser-data-session";
import { marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { chartSymbol } from "@/src/modules/scanner/alpaca/candles";
import { parseQualifiedChartSplits } from "@/src/modules/scanner/alpaca/qualified-chart-splits";
import { parseChartSplits } from "@/src/modules/scanner/alpaca/chart-splits";
import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import { easternClock } from "@/src/modules/scanner/live/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Marker IDs only need to agree across reads in the same running application.
const application = globalThis as typeof globalThis & { traderlinkBrowserSplitIdKey?: Buffer };

function browserSplitId(providerEventId: string): string {
  const key = application.traderlinkBrowserSplitIdKey ??= randomBytes(32);
  return createHmac("sha256", key).update(providerEventId).digest("hex");
}

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export const GET = browserDataRead("split_history_unavailable", async (request: Request) => {
  let identity: ReturnType<typeof requireTraderLinkPlatformRequestIdentity>;
  try { identity = requireTraderLinkPlatformRequestIdentity(request.headers); }
  catch { return reply({ error: "not_authenticated" }, 401); }
  if (!hasSharedChartDataAccess(identity)) return reply({ error: "chart_access_denied" }, 403);
  const query = new URL(request.url).searchParams;
  let symbol: string;
  try { symbol = chartSymbol(query.get("symbol") ?? ""); }
  catch { return reply({ error: "invalid_symbol" }, 400); }
  const selection = marketDataSelection("charts");
  if (!matchesBrowserDataSession(query, "charts", selection)) return reply({ error: "provider_changed" }, 409);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]);
  const result = selection.provider === "moomoo"
    ? await (await import("@/src/modules/market-data/server/moomoo-chart-response")).readMoomooChartSplits(symbol)
    : await requestAlpacaGateway("chart-splits", new URLSearchParams({ symbol }), process.env, signal);
  const current = marketDataSelection("charts");
  if (current.provider !== selection.provider || current.revision !== selection.revision) {
    return reply({ error: "provider_changed" }, 409);
  }
  const basisDate = easternClock(Date.now()).date;
  if (selection.provider === "alpaca") {
    const qualified = parseQualifiedChartSplits(result, symbol, basisDate);
    return reply({ ...qualified, splits: qualified.splits.map(split => ({ ...split, id: browserSplitId(split.id) })) });
  }
  if (!result || typeof result !== "object" || !("symbol" in result) || result.symbol !== symbol ||
    !("basisDate" in result) || result.basisDate !== basisDate || !("splits" in result)) {
    throw Error("invalid_split_history");
  }
  const splits = parseChartSplits(result.splits);
  if (splits.some(split => split.date > basisDate)) throw Error("invalid_split_history");
  return reply({ symbol, basisDate, splits });
});
