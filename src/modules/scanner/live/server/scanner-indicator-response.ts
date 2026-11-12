import "server-only";
import { chartSymbol, type Candle } from "@/src/modules/scanner/alpaca/candles";
import type { ChartCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import { indicatorDisplayRows } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { historyCalendar, scannerIndicatorResults } from "../scanner-indicator-calculation";
import { SCANNER_INDICATOR_FRAMES, prepareScannerIndicatorRows, type ScannerIndicatorRead } from "../scanner-indicator-read";

const headers = { "Cache-Control": "private, no-store" };
const reads = new Map<string, Promise<ScannerIndicatorRead>>();
const limit = 300;

export async function scannerIndicatorResponse(request: Request, loadBars: (request: Request) => Promise<Response>) {
  try {
    if (!hasWatchlistDashboardNavigationAccess(requireTraderLinkPlatformRequestIdentity(request.headers))) {
      return Response.json({ error: "unavailable" }, { status: 404, headers });
    }
  } catch {
    return Response.json({ error: "unavailable" }, { status: 404, headers });
  }
  const url = new URL(request.url);
  const frame = SCANNER_INDICATOR_FRAMES.find(value => value === url.searchParams.get("frame"));
  let symbol: string;
  try { symbol = chartSymbol(url.searchParams.get("symbol") ?? ""); }
  catch { return Response.json({ error: "invalid_symbol" }, { status: 400, headers }); }
  if (!frame) return Response.json({ error: "invalid_frame" }, { status: 400, headers });

  const now = Date.now();
  const window = Number.parseInt(frame, 10) * 60_000;
  const key = `${symbol}:${frame}:${Math.floor(now / window)}`;
  let read = reads.get(key);
  if (!read) {
    url.search = new URLSearchParams({ symbol, scannerIndicators: "1" }).toString();
    // The first viewer's cancellation must not cancel a read shared by other viewers.
    read = (async () => {
      const response = await loadBars(new Request(url, { headers: request.headers }));
      if (!response.ok) throw Error("indicator_bars_unavailable");
      const bars = await response.json() as { symbol?: string; feed?: string; adjustment?: string; bars?: Candle[]; calendar?: ChartCalendar };
      if (bars.symbol !== symbol || bars.feed !== "sip" || bars.adjustment !== "split" || !Array.isArray(bars.bars)) {
        throw Error("invalid_indicator_bars");
      }
      const { result, vwap } = scannerIndicatorResults(bars.bars, frame, Math.floor(now / 60_000) * 60_000, historyCalendar(bars.calendar));
      const rows = prepareScannerIndicatorRows(indicatorDisplayRows({
        result, timeframe: frame, livePrice: null, vwap: vwap?.value ?? null, vwapSignals: vwap?.signals,
      }), result);
      return { symbol, frame, rows, vwap: vwap?.value ?? null };
    })();
    reads.set(key, read);
    if (reads.size > limit) reads.delete(reads.keys().next().value!);
  }
  try { return Response.json(await read, { headers }); }
  catch {
    if (reads.get(key) === read) reads.delete(key);
    return Response.json({ error: "indicator_reads_unavailable" }, { status: 503, headers });
  }
}
