import { NextResponse, type NextRequest } from "next/server";

import { MoomooExecutionImportWorker } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-worker";
import { MoomooExecutionImportScheduler } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-scheduler";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { isAuthorizedDevelopmentDashboardWorker } from "@/src/modules/platform/server/authentication/development-dashboard-network-boundary";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local launcher-only bridge. Hosted beta scheduling is wired at deployment. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorizedDevelopmentDashboardWorker(request.headers)) return new NextResponse(null, { status: 404 });
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
