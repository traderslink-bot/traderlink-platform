import { isAuthorizedPlatformCronRequest } from "@/src/modules/platform/server/authentication/platform-cron-request-authorization";

import { MoomooExecutionImportWorker } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-worker";
import { MoomooExecutionImportScheduler } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-scheduler";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedPlatformCronRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const scheduled = new MoomooExecutionImportScheduler(database).scheduleDue();
    const processed = await new MoomooExecutionImportWorker(database).runOne();
    return Response.json({ ok: true, processed, scheduled });
  } catch (error) {
    recordMoomooOperationFailure({ database, error, stage: "worker" });
    return Response.json({ ok: false }, { status: 500 });
  } finally {
    database.close();
  }
}
