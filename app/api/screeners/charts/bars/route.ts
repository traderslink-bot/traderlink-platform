import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import { scannerIndicatorResponse } from "@/src/modules/scanner/live/server/scanner-indicator-response";
import { proxyAlpacaChart } from "@/src/modules/scanner/alpaca/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function loadIndicatorBars(request: Request) { return proxyAlpacaChart(request, false, true); }

async function readGET(request: Request) {
  const query = new URL(request.url).searchParams;
  return query.get("scannerIndicators") === "1" && query.has("frame")
    ? scannerIndicatorResponse(request, loadIndicatorBars)
    : proxyAlpacaChart(request, false);
}

export const GET = browserDataRead("indicator_reads_unavailable", (request: Request) => readGET(request));
