import { readJournalTradeStory } from
  "@/src/modules/journal/server/trade-story/journal-trade-story-read-service";
import {
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export async function GET(request: Request): Promise<Response> {
  try {
    const roundTripId = new URL(request.url).searchParams.get("roundTripId") ?? "";
    if (!UUID_PATTERN.test(roundTripId)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "roundTripId",
      });
    }
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    return Response.json(readJournalTradeStory(scope, roundTripId), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { status: "unavailable" },
      { status: isTraderLinkPlatformError(error) ? 400 : 500 },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
