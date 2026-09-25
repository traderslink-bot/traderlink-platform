import { NextResponse, type NextRequest } from "next/server";
import { authorizeWatchlistMemberRequest } from "@/src/lib/live-watchlist/live-watchlist-auth";
import { readWatchlistReverseSplits } from "@/src/modules/news/server/reverse-splits/dashboard";
import { validTicker } from "@/src/modules/news/server/reverse-splits/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store" };
  const access = await authorizeWatchlistMemberRequest(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status, headers });
  const raw = request.nextUrl.searchParams.get("tickers") ?? "";
  const tickers = [...new Set(raw.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  if (raw.length > 500 || tickers.length > 100 || tickers.some((ticker) => !validTicker(ticker))) return NextResponse.json({ error: "Invalid ticker selection." }, { status: 400, headers });
  try {
    return NextResponse.json(readWatchlistReverseSplits(tickers), { headers });
  } catch {
    return NextResponse.json({ error: "Reverse-split information is temporarily unavailable." }, { status: 503, headers });
  }
}
