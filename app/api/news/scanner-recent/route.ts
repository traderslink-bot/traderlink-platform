import { timingSafeEqual } from "node:crypto";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { listScannerRecentPressReleases } from "@/src/modules/news/server/scanner-recent-press-releases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Like the News article store, retain one verified connection rather than reopening
// and rechecking the entire database for every scanner ticker.
let database: ReturnType<typeof openPlatformDatabase> | null = null;
let warnedCalendarCoverage = false;

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  const expected = process.env.NEWS_PUBLISH_TOKEN?.trim();
  if (!expected) return json({ ok: false, code: "news_lookup_unavailable" }, 503);
  const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const actualBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return json({ ok: false, code: "unauthorized" }, 401);
  }
  const ticker = (new URL(request.url).searchParams.get("ticker") || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.\-^]{0,31}$/.test(ticker)) return json({ ok: false, code: "invalid_ticker" }, 400);
  try {
    database ??= openPlatformDatabase({ mode: "runtime" });
    const result = listScannerRecentPressReleases(database, ticker);
    if (!result.holidaysCovered && !warnedCalendarCoverage) {
      console.warn("Scanner News holiday calendar needs extending.");
      warnedCalendarCoverage = true;
    }
    return json({
      ok: true, contractVersion: "traderslink_scanner_recent_news_v1", ticker,
      timeZone: "America/New_York", tradingDates: result.dates,
      holidaysCovered: result.holidaysCovered, articles: result.articles,
    });
  } catch (error) {
    database?.close();
    database = null;
    console.error("Scanner recent News lookup failed.", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return json({ ok: false, code: "news_lookup_unavailable" }, 503);
  }
}
