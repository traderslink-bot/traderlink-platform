import { parseCoachReflectionRequest } from "@/src/modules/coach/server/coach-reflection-request";
import { readCoachReflection } from "@/src/modules/coach/server/coach-reflection-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  try {
    const url = new URL(request.url);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const review = readCoachReflection(scope, parseCoachReflectionRequest({
      period: url.searchParams.get("period"),
      date: url.searchParams.get("date"),
      currency: url.searchParams.get("currency"),
    }));
    return Response.json({
      status: review.state,
      contractVersion: "traderlink_review_latest_v1",
      source: "journal_facts",
      review,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_COACH_REFLECTION_UNAVAILABLE";
    return Response.json(
      { status: "unavailable", code },
      { status: code.includes("ACCESS_DENIED") ? 403 : 503 },
    );
  }
}
