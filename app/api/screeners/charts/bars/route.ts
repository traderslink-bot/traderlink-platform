import { scannerIndicatorResponse } from "@/src/modules/scanner/live/server/scanner-indicator-response";
import { proxyAlpacaChart } from "@/src/modules/scanner/alpaca/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function loadBars(request: Request) { return proxyAlpacaChart(request, false); }

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  return query.get("scannerIndicators") === "1" && query.has("frame")
    ? scannerIndicatorResponse(request, loadBars)
    : loadBars(request);
}
