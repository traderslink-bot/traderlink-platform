import { isAuthorizedPlatformCronRequest } from "@/src/modules/platform/server/authentication/platform-cron-request-authorization";

import { CoachUsEquitiesCalendarVerificationService } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-verification-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedPlatformCronRequest(request)) return Response.json({ ok: false }, { status: 401 });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const result = await new CoachUsEquitiesCalendarVerificationService(database).run();
    return Response.json({ ok: true, result });
  } finally {
    database.close();
  }
}
