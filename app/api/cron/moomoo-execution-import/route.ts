import { timingSafeEqual } from "node:crypto";

import { MoomooExecutionImportWorker } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-worker";
import { MoomooExecutionImportScheduler } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-scheduler";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(`Bearer ${secret}`, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 401 });
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
