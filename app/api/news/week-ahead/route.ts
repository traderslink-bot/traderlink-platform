import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

import { WeekAheadRepository } from "@/src/modules/news/server/week-ahead-repository";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.WEEK_AHEAD_PUBLISH_TOKEN?.trim() || process.env.NEWS_PUBLISH_TOKEN?.trim();
  const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/iu, "").trim();
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const suppliedBuffer = Buffer.from(supplied, "utf8");
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ code: "unauthorized", ok: false }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ code: "invalid_json", ok: false }, { status: 400 });
  }
  try {
    const result = withPlatformDatabase(
      { mode: "runtime" },
      (database) => new WeekAheadRepository(database).publish(payload),
    );
    revalidatePath("/market-news/week-ahead");
    revalidatePath("/notifications");
    return Response.json({
      dashboardPath: "/market-news/week-ahead",
      issue: {
        id: result.issue.issueId,
        publishedAt: result.issue.publishedAtUtc,
        title: result.issue.title,
      },
      notificationCount: result.notificationCount,
      ok: true,
      wasUpdated: result.wasUpdated,
    });
  } catch {
    return Response.json({ code: "invalid_week_ahead_issue", ok: false }, { status: 400 });
  }
}
