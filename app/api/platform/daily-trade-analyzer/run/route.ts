import { NextResponse, type NextRequest } from "next/server";

import { DailyTradeAnalyzerRepository } from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { DailyTradeMoomooAnalyzerWorker } from "@/src/modules/level-analysis/server/daily-trade-yahoo-analyzer-worker";
import { MoomooDailyTradeKlineMarketDataProvider } from "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider";
import {
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
} from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";
import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

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
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const connections = new MoomooConnectionRepository(database);
    const processed = await new DailyTradeMoomooAnalyzerWorker(
      new DailyTradeAnalyzerRepository(database),
      (scope) => new MoomooDailyTradeKlineMarketDataProvider(
        () => new MoomooConnectionAccessService(connections).accessToken({
          ...scope,
          allowedAccountIds: [scope.accountId],
          activeAccountId: scope.accountId,
        }),
      ),
    ).runOne();
    return NextResponse.json({ processed });
  } catch (error) {
    console.error("TraderLink local daily trade analyzer run failed.", {
      errorCode: error instanceof Error ? error.message : "unknown",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ processed: false }, { status: 500 });
  } finally {
    database.close();
  }
}
