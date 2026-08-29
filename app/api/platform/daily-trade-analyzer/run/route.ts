import { NextResponse, type NextRequest } from "next/server";

import { runDailyTradeAnalyzerOnce } from "@/src/modules/level-analysis/server/daily-trade-analyzer-runtime";
import {
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
} from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function allowed(request: NextRequest): boolean {
  const token = process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV];
  return process.env.NODE_ENV === "development" &&
    process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV] === "1" &&
    typeof token === "string" && token.length > 0 &&
    request.headers.get(TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER) === token;
}

/** Local launcher-only bridge: Moomoo modules stay inside the Next server boundary. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!allowed(request)) return new NextResponse(null, { status: 404 });
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
