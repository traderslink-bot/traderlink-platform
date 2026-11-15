import { NextResponse, type NextRequest } from "next/server";

import { runDailyTradeAnalyzerOnce } from "@/src/modules/level-analysis/server/daily-trade-analyzer-runtime";
import { isAuthorizedDevelopmentDashboardWorker } from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local launcher-only bridge: Moomoo modules stay inside the Next server boundary. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorizedDevelopmentDashboardWorker(request.headers)) return new NextResponse(null, { status: 404 });
  try {
    const processed = await runDailyTradeAnalyzerOnce();
    return NextResponse.json({ processed });
  } catch (error) {
    console.error("TraderLink local daily trade analyzer run failed.", {
      errorCode: error instanceof Error ? error.message : "unknown",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ processed: false }, { status: 500 });
  }
}
