import { isAuthorizedPlatformCronRequest } from "@/src/modules/platform/server/authentication/platform-cron-request-authorization";

import { CoachAiReviewGenerationCoordinatorV2 } from
  "@/src/modules/coach/server/coach-ai-review-generation-coordinator-v2";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedPlatformCronRequest(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const summary = await new CoachAiReviewGenerationCoordinatorV2(database).run();
    return Response.json({ ok: true, summary });
  } finally {
    database.close();
  }
}
