import { NextResponse, type NextRequest } from "next/server";

import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { LiveWatchlistStore } from "@/src/lib/live-watchlist/live-watchlist-store";
import { measurePlatformRequestPhase, measurePlatformRequestPhaseAsync, withPlatformRequestTiming } from "@/src/modules/platform/server/observability/platform-request-timing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withPlatformRequestTiming(async () => {
    const auth = await measurePlatformRequestPhaseAsync("auth", () => authorizeWatchlistMemberRequest(request));
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const data = await measurePlatformRequestPhaseAsync("watchlist", () => new LiveWatchlistStore().listSymbols());
    return measurePlatformRequestPhase("json", () => NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    }));
  });
}
