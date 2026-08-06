import { timingSafeEqual } from "node:crypto";

import { CoachMonthlyAiReviewRunner } from "@/src/modules/coach/server/coach-monthly-ai-review-runner";
import { CoachWeeklyAiReviewRunner } from "@/src/modules/coach/server/coach-weekly-ai-review-runner";
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
  if (!authorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const now = new Date();
    const weekly = await new CoachWeeklyAiReviewRunner(database).run(now);
    const monthly = await new CoachMonthlyAiReviewRunner(database).run(now);
    return Response.json({ ok: true, summary: { weekly, monthly } });
  } finally {
    database.close();
  }
}
