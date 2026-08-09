import { NextResponse, type NextRequest } from "next/server";

import { MoomooExecutionImportWorker } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-worker";
import { MoomooExecutionImportScheduler } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-scheduler";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import {
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
} from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";
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

/** Local launcher-only bridge. Hosted beta scheduling is wired at deployment. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!allowed(request)) return new NextResponse(null, { status: 404 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const scheduled = new MoomooExecutionImportScheduler(database).scheduleDue();
    const processed = await new MoomooExecutionImportWorker(database).runOne();
    return NextResponse.json({ processed, scheduled });
  } catch (error) {
    recordMoomooOperationFailure({ database, error, stage: "worker" });
    return NextResponse.json({ processed: false, scheduled: 0 }, { status: 500 });
  } finally {
    database.close();
  }
}
