import { browserDataRead } from "@/src/modules/market-data/server/browser-data-errors";
import { projectWatchlistTickerForViewer } from "@/src/modules/watchlist/server/access/watchlist-ticker-projection";
import { NextResponse, type NextRequest } from "next/server";

import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { createLiveWatchlistStream } from "@/src/lib/live-watchlist/live-watchlist-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readGET(request: NextRequest): Promise<Response> {
  const auth = await authorizeWatchlistMemberRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return new Response(createLiveWatchlistStream(symbol => projectWatchlistTickerForViewer(symbol, request.headers)), {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
    },
  });
}

export const GET = browserDataRead("watchlist_unavailable", readGET);
