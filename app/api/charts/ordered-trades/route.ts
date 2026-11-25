import { proxyOrderedChartTrades } from "@/src/modules/scanner/alpaca/ordered-chart-trade-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyOrderedChartTrades(request);
}
