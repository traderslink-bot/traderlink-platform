import { proxyAlpacaChart } from "@/src/modules/scanner/alpaca/proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return proxyAlpacaChart(request, false); }
