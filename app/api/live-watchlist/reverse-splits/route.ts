import { NextResponse, type NextRequest } from "next/server";
import { requireTraderLinkPlatformDiscordMemberRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasReverseSplitReviewAccess } from "@/src/modules/news/server/reverse-splits/access";
import { readWatchlistReverseSplits } from "@/src/modules/news/server/reverse-splits/dashboard";
import { validTicker } from "@/src/modules/news/server/reverse-splits/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  let allowed = false;
  try {
    allowed = hasReverseSplitReviewAccess(requireTraderLinkPlatformDiscordMemberRequestIdentity(request.headers));
  } catch {
    allowed = false;
  }
  if (!allowed) return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  const raw = request.nextUrl.searchParams.get("tickers") ?? "";
  const tickers = [...new Set(raw.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))];
  if (raw.length > 500 || tickers.length > 100 || tickers.some((ticker) => !validTicker(ticker))) return NextResponse.json({ error: "Invalid ticker selection." }, { status: 400, headers });
  try {
    return NextResponse.json(readWatchlistReverseSplits(tickers), { headers });
  } catch {
    return NextResponse.json({ error: "Reverse-split information is temporarily unavailable." }, { status: 503, headers });
  }
}
