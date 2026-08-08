import { timingSafeEqual } from "node:crypto";

import { CoachUsEquitiesCalendarVerificationService } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-verification-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

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
    const result = await new CoachUsEquitiesCalendarVerificationService(database).run();
    return Response.json({ ok: true, result });
  } finally {
    database.close();
  }
}
